import React from 'react';
import { Boss } from '../services/BossService';
import { Player } from '../services/PlayerService';

interface BottomPanelProps {
    player: Player | null;
    boss: Boss | null;
    isBossDefeated: boolean;
    bossDying: boolean;
    descendClicked: boolean;
    actionInProgress: boolean;
    forcedPlayerAction: string | null;
    physicalAbilities: string[];
    activeAbilities: string[];
    canCast: boolean;
    visibleActionBarSpells: string[];
    formatSpellName: (name: string) => string;
    isActionAffordable: (action: string) => boolean;
    handleAction: (action: string) => void;
    onOpenCastMenu: () => void;
    onDescend: () => void;
    onShowPlayerStatus: () => void;
}

const BottomPanel: React.FC<BottomPanelProps> = ({
    player,
    boss,
    isBossDefeated,
    bossDying,
    descendClicked,
    actionInProgress,
    forcedPlayerAction,
    physicalAbilities,
    activeAbilities,
    canCast,
    visibleActionBarSpells,
    formatSpellName,
    isActionAffordable,
    handleAction,
    onOpenCastMenu,
    onDescend,
    onShowPlayerStatus,
}) => {
    return (
        <div id="bottom-panel" className="w-full h-32 border-t-2 border-gray-400 flex items-center justify-between px-4">
            <div id="life-bar" className="flex items-center gap-2">
                <div className="w-24 h-24 rounded-full bg-black border-2 border-gray-400 relative overflow-hidden">
                    <div className="absolute bottom-0 w-full bg-red-600" style={{height: `${((player?.life || 0) / (player?.max_life || 100)) * 100}%`}}></div>
                    <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">{Math.round(player?.life || 0)}</div>
                </div>
            </div>
            <div id="stamina-bar" className="flex items-center gap-2">
                <div className="w-24 h-24 rounded-full bg-black border-2 border-gray-400 relative overflow-hidden">
                    <div className="absolute bottom-0 w-full bg-green-600" style={{height: `${((player?.stamina || 0) / (player?.max_stamina || 100)) * 100}%`}}></div>
                    <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">{Math.round(player?.stamina || 0)}</div>
                </div>
            </div>
            <div id="mana-bar" className="flex items-center gap-2">
                <div className="w-24 h-24 rounded-full bg-black border-2 border-gray-400 relative overflow-hidden">
                    <div className="absolute bottom-0 w-full bg-blue-600" style={{height: `${((player?.mana || 0) / (player?.max_mana || 100)) * 100}%`}}></div>
                    <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">{Math.round(player?.mana || 0)}</div>
                </div>
            </div>
            <div id="character-picture" className="flex items-center gap-2">
                <button
                    onClick={onShowPlayerStatus}
                    className="w-24 h-24 rounded-full bg-gray-800 border-2 border-gray-400 hover:bg-gray-700 transition-colors flex items-center justify-center text-xs font-bold tracking-wide"
                >
                    Status
                </button>
            </div>
            <div id="action-bar" className="flex items-center gap-2 w-full">
                {boss && (isBossDefeated || bossDying) ? (
                    <div
                        className={`w-64 h-24 rounded-lg border-2 border-gray-400 flex items-center justify-center ${
                            descendClicked
                                ? 'bg-gray-900 text-gray-600 cursor-not-allowed'
                                : 'cursor-pointer bg-green-800 hover:bg-green-700 active:bg-green-600'
                        }`}
                        onClick={onDescend}
                    >
                        Descend
                    </div>
                ) : (
                    <>
                        {forcedPlayerAction && (
                            <div className="shrink-0 px-3 h-24 rounded-lg border-2 border-yellow-500 bg-yellow-900 bg-opacity-40 flex flex-col items-center justify-center text-yellow-300 text-xs font-semibold gap-1">
                                <span className="uppercase tracking-widest text-yellow-500" style={{fontSize:'0.6rem'}}>Forced</span>
                                <span className="text-sm capitalize">{forcedPlayerAction}</span>
                            </div>
                        )}
                        <div
                            className={`w-48 h-24 rounded-lg border-2 border-gray-400 flex items-center justify-center cursor-pointer ${
                                actionInProgress || bossDying || (forcedPlayerAction && forcedPlayerAction !== 'attack')
                                    ? 'bg-gray-900 text-gray-600 cursor-not-allowed opacity-40'
                                    : 'bg-gray-800 hover:bg-gray-700 active:bg-gray-600'
                            }`}
                            onClick={() => !actionInProgress && !bossDying && (!forcedPlayerAction || forcedPlayerAction === 'attack') && handleAction('attack')}
                        >
                            Attack
                        </div>
                        <div
                            className={`w-48 h-24 rounded-lg border-2 border-gray-400 flex items-center justify-center cursor-pointer ${
                                actionInProgress || bossDying || (forcedPlayerAction && forcedPlayerAction !== 'guard')
                                    ? 'bg-gray-900 text-gray-600 cursor-not-allowed opacity-40'
                                    : 'bg-yellow-900 hover:bg-yellow-800 active:bg-yellow-700'
                            }`}
                            onClick={() => !actionInProgress && !bossDying && (!forcedPlayerAction || forcedPlayerAction === 'guard') && handleAction('guard')}
                        >
                            Guard
                        </div>
                        {physicalAbilities.map((ability) => {
                            const affordable = isActionAffordable(ability);
                            const abilityDisabled = actionInProgress || bossDying || !affordable || (forcedPlayerAction && forcedPlayerAction !== ability);
                            return (
                                <div
                                    key={ability}
                                    className={`w-48 h-24 rounded-lg border-2 border-gray-400 flex items-center justify-center cursor-pointer ${
                                        abilityDisabled
                                            ? 'bg-gray-900 text-gray-600 cursor-not-allowed opacity-40'
                                            : 'bg-orange-900 hover:bg-orange-800 active:bg-orange-700'
                                    }`}
                                    onClick={() => !abilityDisabled && handleAction(ability)}
                                >
                                    {formatSpellName(ability)}
                                </div>
                            );
                        })}
                        {activeAbilities.map((ability) => {
                            const cooldownTurns = ((player?.cooldowns?.[ability] ?? 0) as number);
                            const onCooldown = cooldownTurns > 0;
                            const affordable = isActionAffordable(ability);
                            const abilityDisabled = actionInProgress || bossDying || onCooldown || !affordable || (forcedPlayerAction != null && forcedPlayerAction !== ability);
                            return (
                                <div
                                    key={ability}
                                    className={`w-48 h-24 rounded-lg border-2 border-gray-400 flex flex-col items-center justify-center cursor-pointer ${
                                        abilityDisabled
                                            ? 'bg-gray-900 text-gray-600 cursor-not-allowed opacity-40'
                                            : 'bg-teal-900 hover:bg-teal-800 active:bg-teal-700'
                                    }`}
                                    onClick={() => !abilityDisabled && handleAction(ability)}
                                >
                                    <span>{formatSpellName(ability)}</span>
                                    {onCooldown && <span className="text-xs mt-1 opacity-80">{cooldownTurns} turn{cooldownTurns !== 1 ? 's' : ''}</span>}
                                </div>
                            );
                        })}
                        {canCast && (
                            <div
                                className={`w-48 h-24 rounded-lg border-2 border-gray-400 flex items-center justify-center cursor-pointer ${
                                    actionInProgress || bossDying || (forcedPlayerAction && !forcedPlayerAction.startsWith('cast'))
                                        ? 'bg-gray-900 text-gray-600 cursor-not-allowed opacity-40'
                                        : 'bg-purple-800 hover:bg-purple-700 active:bg-purple-600'
                                }`}
                                onClick={() => !actionInProgress && !bossDying && (!forcedPlayerAction || forcedPlayerAction.startsWith('cast')) && onOpenCastMenu()}
                            >
                                Cast
                            </div>
                        )}
                        {visibleActionBarSpells.map((spell) => {
                            const actionName = `cast:${spell}`;
                            const affordable = isActionAffordable(actionName);
                            const spellDisabled = actionInProgress || bossDying || !affordable || (forcedPlayerAction && forcedPlayerAction !== actionName);
                            return (
                                <div
                                    key={spell}
                                    className={`w-48 h-24 rounded-lg border-2 border-gray-400 flex items-center justify-center cursor-pointer ${
                                        spellDisabled
                                            ? 'bg-gray-900 text-gray-600 cursor-not-allowed opacity-40'
                                            : 'bg-blue-800 hover:bg-blue-700 active:bg-blue-600'
                                    }`}
                                    onClick={() => !spellDisabled && handleAction(actionName)}
                                >
                                    {formatSpellName(spell)}
                                </div>
                            );
                        })}
                    </>
                )}
            </div>
        </div>
    );
};

export default BottomPanel;
