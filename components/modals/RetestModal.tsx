import React, { useState, useEffect } from 'react';
import type { Collection } from '../../types';

interface FlattenedRecord {
  recordId: string;
  hubId: string;
  hubName: string;
  date: string;
  session: 'Morning' | 'Evening';
  original: Collection;
  retest?: Collection;
}

interface RetestModalProps {
    record: FlattenedRecord;
    onClose: () => void;
    onSave: (retestData: Collection) => void;
}

const RetestModal: React.FC<RetestModalProps> = ({ record, onClose, onSave }) => {
    const [retestData, setRetestData] = useState<Collection>(
        record.retest || { quantity: 0, fat: 0, snf: 0 }
    );
    
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [onClose]);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(retestData);
    };

    const handleInputChange = (field: keyof Collection, value: string) => {
        const numericValue = parseFloat(value) || 0;
        setRetestData(prev => ({...prev, [field]: numericValue}));
    };

    return (
        <div 
            className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center" 
            onClick={onClose}
        >
            <div 
                className="relative mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white"
                onClick={e => e.stopPropagation()}
            >
                <div className="mt-3">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 text-center">Re-test for {record.hubName}</h3>
                    <p className="text-sm text-gray-500 text-center mt-1">{record.date} - {record.session} Collection</p>

                    <div className="grid grid-cols-2 gap-x-6 gap-y-4 mt-6 text-sm">
                        <div className="font-semibold text-gray-800 col-span-2 border-b pb-2">Original Values (from Sub Hub)</div>
                        <div><span className="text-gray-500">Quantity:</span> {record.original.quantity.toFixed(2)} L</div>
                        <div><span className="text-gray-500">Fat:</span> {record.original.fat.toFixed(2)}</div>
                        <div><span className="text-gray-500">SNF:</span> {record.original.snf.toFixed(2)}</div>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-6 text-left space-y-4">
                         <div className="font-semibold text-gray-800 col-span-2 border-b pb-2 text-sm">New Values (from Main Hub)</div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700">Quantity (Liters)</label>
                            <input
                                type="number" step="0.01"
                                value={retestData.quantity}
                                onChange={(e) => handleInputChange('quantity', e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Fat</label>
                            <input
                                type="number" step="0.01"
                                value={retestData.fat}
                                onChange={(e) => handleInputChange('fat', e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                required
                            />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700">SNF</label>
                            <input
                                type="number" step="0.01"
                                value={retestData.snf}
                                onChange={(e) => handleInputChange('snf', e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                required
                            />
                        </div>

                        <div className="items-center px-4 py-3 flex justify-end space-x-2 bg-gray-50 -mx-5 -mb-5 rounded-b-md mt-8">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Save Re-test
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default RetestModal;