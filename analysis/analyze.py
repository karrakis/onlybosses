#!/usr/bin/env python3
"""
Only Bosses — keyword balance analysis tool.

Usage:
  python3 analysis/analyze.py              # full report to stdout
  python3 analysis/analyze.py --depth 5   # only snapshots at depth >= 5
  python3 analysis/analyze.py --tree      # also print feature importances from a fitted tree
"""

import argparse
import sys
import warnings
warnings.filterwarnings('ignore')

import psycopg2
import pandas as pd
import numpy as np
from psycopg2.extras import RealDictCursor

# ── DB connection ──────────────────────────────────────────────────────────────

DB = dict(host='localhost', dbname='only_bosses_development',
          user='only_bosses', password='gargoyle')

def connect():
    return psycopg2.connect(**DB)

# ── Data loading ───────────────────────────────────────────────────────────────

def load_data(min_depth: int = 1) -> pd.DataFrame:
    """
    Returns one row per depth_snapshot with:
      - depth, reached_next (label)
      - one binary column per keyword (player_kw_<name>)
      - one binary column per keyword (boss_kw_<name>)
      - one numeric column per modifier key (player_mod_<key>, boss_mod_<key>)
    """
    with connect() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:

            # 1. All keyword names
            cur.execute("SELECT id, name FROM boss_keywords ORDER BY name")
            kw_rows = cur.fetchall()
            kw_id_to_name = {r['id']: r['name'] for r in kw_rows}

            # 2. All modifier keys
            cur.execute("SELECT id, key FROM modifier_keys ORDER BY key")
            mk_rows = cur.fetchall()
            mk_id_to_key = {r['id']: r['key'] for r in mk_rows}

            # 3. Snapshots
            cur.execute("""
                SELECT ds.id, ds.depth, ds.reached_next,
                       ds.keyword_ids, ds.boss_keyword_ids
                FROM depth_snapshots ds
                JOIN runs r ON r.id = ds.run_id
                WHERE r.outcome = 'died'
                  AND ds.depth >= %s
                ORDER BY ds.id
            """, (min_depth,))
            snapshots = cur.fetchall()

            if not snapshots:
                print(f"No snapshots found at depth >= {min_depth}.", file=sys.stderr)
                sys.exit(1)

            snapshot_ids = [s['id'] for s in snapshots]

            # 4. Modifiers for those snapshots
            cur.execute("""
                SELECT sm.depth_snapshot_id, sm.modifier_key_id, sm.context, sm.value
                FROM snapshot_modifiers sm
                WHERE sm.depth_snapshot_id = ANY(%s)
            """, (snapshot_ids,))
            mod_rows = cur.fetchall()

    # ── Build rows ────────────────────────────────────────────────────────────
    all_kw_names  = sorted(kw_id_to_name.values())
    all_mod_keys  = sorted(mk_id_to_key.values())

    # Index modifiers by snapshot_id
    mods_by_snap = {}
    for mr in mod_rows:
        sid  = mr['depth_snapshot_id']
        key  = mk_id_to_key[mr['modifier_key_id']]
        ctx  = mr['context']
        val  = float(mr['value'])
        mods_by_snap.setdefault(sid, {})[f"{ctx}_mod_{key}"] = val

    rows = []
    for s in snapshots:
        row = {'depth': s['depth'], 'reached_next': int(s['reached_next'])}

        # Keyword one-hots
        player_kw_ids = set(s['keyword_ids'] or [])
        boss_kw_ids   = set(s['boss_keyword_ids'] or [])
        for kw_id, name in kw_id_to_name.items():
            row[f"player_kw_{name}"] = 1 if kw_id in player_kw_ids else 0
            row[f"boss_kw_{name}"]   = 1 if kw_id in boss_kw_ids   else 0

        # Modifiers (default: 0 for additive-base keys, 1 for multiplicative)
        for mk_key in all_mod_keys:
            for ctx in ('player', 'boss'):
                col = f"{ctx}_mod_{mk_key}"
                default = 0.0 if any(k in mk_key for k in ('lifesteal', 'base_damage')) else 1.0
                row[col] = mods_by_snap.get(s['id'], {}).get(col, default)

        rows.append(row)

    return pd.DataFrame(rows)

# ── Analysis functions ─────────────────────────────────────────────────────────

def survival_rates(df: pd.DataFrame) -> pd.DataFrame:
    """Per-depth survival rate (fraction of snapshots where reached_next=True)."""
    grp = df.groupby('depth')['reached_next']
    return pd.DataFrame({
        'snapshots': grp.count(),
        'survived':  grp.sum(),
        'rate':      grp.mean().round(3),
    })

def keyword_survival(df: pd.DataFrame, context: str = 'player') -> pd.DataFrame:
    """
    For each keyword, survival rate when present vs absent.
    Columns: with_rate, without_rate, delta, present_count
    """
    kw_cols = [c for c in df.columns if c.startswith(f"{context}_kw_")]
    records = []
    for col in kw_cols:
        name    = col[len(f"{context}_kw_"):]
        present = df[df[col] == 1]
        absent  = df[df[col] == 0]
        if len(present) == 0:
            continue
        with_r    = present['reached_next'].mean()
        without_r = absent['reached_next'].mean() if len(absent) > 0 else float('nan')
        records.append({
            'keyword':       name,
            'present':       len(present),
            'with_rate':     round(with_r,    3),
            'without_rate':  round(without_r, 3),
            'delta':         round(with_r - (without_r if not np.isnan(without_r) else with_r), 3),
        })
    return pd.DataFrame(records).sort_values('delta', ascending=False).reset_index(drop=True)

def modifier_correlation(df: pd.DataFrame, context: str = 'player') -> pd.DataFrame:
    """Pearson correlation of each modifier value with reached_next."""
    mod_cols = [c for c in df.columns if c.startswith(f"{context}_mod_")]
    corrs = {col: df[col].corr(df['reached_next']) for col in mod_cols}
    out = pd.DataFrame([
        {'modifier': c[len(f"{context}_mod_"):], 'correlation': round(v, 4)}
        for c, v in corrs.items() if not np.isnan(v)
    ])
    return out.sort_values('correlation', ascending=False).reset_index(drop=True)

def fit_tree(df: pd.DataFrame):
    """
    Fit a gradient-boosted tree on the feature matrix.
    Returns (model, feature_importance_df).
    """
    from sklearn.ensemble import GradientBoostingClassifier
    from sklearn.model_selection import cross_val_score

    feature_cols = [c for c in df.columns if c not in ('depth', 'reached_next')]
    X = df[['depth'] + feature_cols].values
    y = df['reached_next'].values

    model = GradientBoostingClassifier(n_estimators=200, max_depth=4,
                                       learning_rate=0.05, random_state=42)
    scores = cross_val_score(model, X, y, cv=5, scoring='roc_auc')
    model.fit(X, y)

    feature_names = ['depth'] + feature_cols
    imp = pd.DataFrame({
        'feature':    feature_names,
        'importance': model.feature_importances_,
    }).sort_values('importance', ascending=False).reset_index(drop=True)

    return model, imp, scores

# ── Report ─────────────────────────────────────────────────────────────────────

def hr(label=''):
    width = 72
    if label:
        print(f"\n{'─' * 3} {label} {'─' * (width - 5 - len(label))}")
    else:
        print('─' * width)

def print_report(df: pd.DataFrame, run_tree: bool = False):
    print(f"\nOnly Bosses — Balance Analysis")
    print(f"Dataset: {len(df)} snapshots across depths {df['depth'].min()}–{df['depth'].max()}")

    hr("Survival rate by depth")
    sr = survival_rates(df)
    print(sr.to_string())

    hr("Player keyword survival delta (sorted by impact)")
    ks = keyword_survival(df, 'player')
    print(ks.to_string(index=False))

    hr("Boss keyword survival delta (what boss keywords are hardest to beat)")
    bks = keyword_survival(df, 'boss')
    # For boss, positive delta means player survives *more* when boss has it — i.e. easy boss
    bks['delta'] = -bks['delta']  # flip: positive = boss keyword that kills players
    bks = bks.rename(columns={'delta': 'player_death_delta'})
    bks = bks.sort_values('player_death_delta', ascending=False).reset_index(drop=True)
    print(bks.to_string(index=False))

    hr("Player modifier correlation with survival")
    mc = modifier_correlation(df, 'player')
    print(mc.to_string(index=False))

    if run_tree:
        if len(df) < 50:
            print("\n[tree] Insufficient data for a reliable model (need >= 50 rows).")
        else:
            hr("Gradient-boosted tree — top 30 features by importance")
            _, imp, scores = fit_tree(df)
            print(f"5-fold ROC-AUC: {scores.mean():.3f} ± {scores.std():.3f}")
            print()
            print(imp.head(30).to_string(index=False))

    print()

# ── Entry point ────────────────────────────────────────────────────────────────

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--depth', type=int, default=1,
                        help='Only include snapshots at this depth or deeper (default: 1)')
    parser.add_argument('--tree', action='store_true',
                        help='Fit a gradient-boosted tree and print feature importances')
    parser.add_argument('--out', type=str, default=None,
                        help='Write report to this file instead of stdout')
    args = parser.parse_args()

    df = load_data(min_depth=args.depth)

    if args.out:
        import io
        buf = io.StringIO()
        _stdout = sys.stdout
        sys.stdout = buf
        print_report(df, run_tree=args.tree)
        sys.stdout = _stdout
        with open(args.out, 'w') as f:
            f.write(buf.getvalue())
        print(f"Wrote report to {args.out}")
    else:
        print_report(df, run_tree=args.tree)
