import React, { useState, useEffect } from 'react';
import type { Hub, User } from '../../types';

interface EditHubUserModalProps {
    hub: Hub;
    user: User;
    onClose: () => void;
    onSave: (userId: string, credentials: { username?: string, password?: string }) => void;
}

const EditHubUserModal: React.FC<EditHubUserModalProps> = ({ hub, user, onClose, onSave }) => {
    const [username, setUsername] = useState(user.username);
    const [password, setPassword] = useState('');

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
        onSave(user.id, { username, password });
    }

    return (
        <div 
            className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center" 
            id="my-modal"
            onClick={onClose}
        >
            <div 
                className="relative mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white"
                onClick={e => e.stopPropagation()} // Prevent click from closing modal
            >
                <div className="mt-3 text-center">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Edit Credentials for {hub.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">Incharge: {user.name}</p>

                    <form onSubmit={handleSubmit} className="mt-6 text-left space-y-4">
                         <div>
                            <label htmlFor="username-edit" className="block text-sm font-medium text-gray-700">
                                Username
                            </label>
                            <input
                                type="text"
                                id="username-edit"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="password-edit" className="block text-sm font-medium text-gray-700">
                                New Password
                            </label>
                            <input
                                type="password"
                                id="password-edit"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                placeholder="Leave blank to keep unchanged"
                            />
                        </div>

                        <div className="items-center px-4 py-3 flex justify-end space-x-2 bg-gray-50 -mx-5 -mb-5 rounded-b-md">
                            <button
                                id="cancel-btn"
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
                            >
                                Cancel
                            </button>
                            <button
                                id="save-btn"
                                type="submit"
                                className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditHubUserModal;
