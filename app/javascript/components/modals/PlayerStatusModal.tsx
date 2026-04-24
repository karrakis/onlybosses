import React from 'react';

interface SummaryRow {
    label: string;
    value: string;
}

interface KeywordRow {
    label: string;
    value: string;
    count: number;
}

interface PlayerStatusModalProps {
    show: boolean;
    onClose: () => void;
    statusSearch: string;
    setStatusSearch: (value: string) => void;
    statusPage: number;
    setStatusPage: React.Dispatch<React.SetStateAction<number>>;
    statusTotalPages: number;
    summaryRows: SummaryRow[];
    paginatedKeywordRows: KeywordRow[];
    filteredKeywordRows: KeywordRow[];
}

const PlayerStatusModal: React.FC<PlayerStatusModalProps> = ({
    show,
    onClose,
    statusSearch,
    setStatusSearch,
    statusPage,
    setStatusPage,
    statusTotalPages,
    summaryRows,
    paginatedKeywordRows,
    filteredKeywordRows,
}) => {
    if (!show) return null;

    return (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-gray-800 border-4 border-cyan-500 rounded-lg p-8 w-full max-w-4xl max-h-[85vh] flex flex-col">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-3xl font-bold">Player Status</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-300 hover:text-white text-2xl"
                    >
                        ×
                    </button>
                </div>

                <input
                    type="text"
                    placeholder="Search powers..."
                    value={statusSearch}
                    onChange={(e) => setStatusSearch(e.target.value)}
                    className="w-full mb-4 px-4 py-2 rounded bg-gray-900 border border-gray-600 text-white"
                />

                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                    {statusPage === 1 && !statusSearch && (
                        <div className="bg-gray-700 border border-cyan-700 rounded-lg px-4 py-3 space-y-2">
                            {summaryRows.map((row, idx) => (
                                <div
                                    key={`summary-${row.label}-${idx}`}
                                    className="flex justify-between gap-4"
                                >
                                    <span className="font-semibold text-cyan-300 shrink-0">{row.label}</span>
                                    <span className="text-gray-100 text-right break-words">{row.value}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {paginatedKeywordRows.length === 0 && filteredKeywordRows.length === 0 && statusSearch ? (
                        <div className="text-gray-400 text-center py-8">No powers match your search.</div>
                    ) : (
                        paginatedKeywordRows.map((row, idx) => (
                            <div
                                key={`keyword-${row.label}-${idx}`}
                                className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 relative"
                            >
                                {row.count > 1 && (
                                    <span className="absolute top-2 right-2 bg-yellow-500 text-black text-xs font-bold px-1.5 py-0.5 rounded">
                                        x{row.count}
                                    </span>
                                )}
                                <div className="text-lg font-semibold capitalize mb-1">{row.label}</div>
                                <div className="text-sm text-gray-200 break-words">{row.value}</div>
                            </div>
                        ))
                    )}
                </div>

                {statusTotalPages > 1 && (
                    <div className="mt-4 pt-4 border-t border-gray-600 flex items-center justify-between">
                        <button
                            onClick={() => setStatusPage((p) => Math.max(1, p - 1))}
                            disabled={statusPage <= 1}
                            className={`px-4 py-2 rounded border ${
                                statusPage <= 1
                                    ? 'bg-gray-700 border-gray-600 text-gray-500 cursor-not-allowed'
                                    : 'bg-gray-700 border-gray-500 hover:bg-gray-600'
                            }`}
                        >
                            Previous
                        </button>
                        <div className="text-sm text-gray-300">
                            Page {statusPage} / {statusTotalPages}
                        </div>
                        <button
                            onClick={() => setStatusPage((p) => Math.min(statusTotalPages, p + 1))}
                            disabled={statusPage >= statusTotalPages}
                            className={`px-4 py-2 rounded border ${
                                statusPage >= statusTotalPages
                                    ? 'bg-gray-700 border-gray-600 text-gray-500 cursor-not-allowed'
                                    : 'bg-gray-700 border-gray-500 hover:bg-gray-600'
                            }`}
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlayerStatusModal;
