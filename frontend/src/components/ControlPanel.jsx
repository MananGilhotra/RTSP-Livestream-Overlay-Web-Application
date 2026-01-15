import { useState, useRef } from 'react';
import { uploadImage } from '../services/api';

/**
 * ControlPanel Component
 * UI for adding and managing overlays.
 */
function ControlPanel({ overlays, onAdd, onDelete }) {
    const [textContent, setTextContent] = useState('');
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    const handleAddText = () => {
        if (!textContent.trim()) {
            alert('Please enter text content');
            return;
        }

        onAdd({
            type: 'text',
            content: textContent,
            x: 50,
            y: 50,
            width: 200,
            height: 60,
        });
        setTextContent('');
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const data = await uploadImage(file);
            onAdd({
                type: 'image',
                content: data.url,
                x: 100,
                y: 100,
                width: 200,
                height: 150,
            });
        } catch (err) {
            alert('Failed to upload image: ' + err.message);
        } finally {
            setUploading(false);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const triggerFileSelect = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="control-panel">
            <h2>Overlay Controls</h2>

            {/* Add Text Overlay */}
            <div className="control-section">
                <h3>Add Text Overlay</h3>
                <input
                    type="text"
                    placeholder="Enter text content..."
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    className="control-input"
                />
                <button onClick={handleAddText} className="control-button add-text">
                    Add Text
                </button>
            </div>

            {/* Add Image Overlay */}
            <div className="control-section">
                <h3>Add Image Overlay</h3>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    style={{ display: 'none' }}
                />
                <button
                    onClick={triggerFileSelect}
                    className="control-button add-image"
                    disabled={uploading}
                >
                    {uploading ? (
                        <>
                            <span className="loading-spinner"></span>
                            Uploading...
                        </>
                    ) : (
                        <>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                            </svg>
                            Upload Image
                        </>
                    )}
                </button>
            </div>

            {/* Overlay List */}
            <div className="control-section">
                <h3>Current Overlays ({overlays.length})</h3>
                <ul className="overlay-list">
                    {overlays.map((overlay) => (
                        <li key={overlay._id} className="overlay-item">
                            <span className="overlay-info">
                                <span className={`overlay-type ${overlay.type}`}>
                                    {overlay.type}
                                </span>
                                <span className="overlay-content">
                                    {overlay.type === 'text'
                                        ? overlay.content.substring(0, 20) + (overlay.content.length > 20 ? '...' : '')
                                        : 'Image'
                                    }
                                </span>
                            </span>
                            <button
                                onClick={() => onDelete(overlay._id)}
                                className="delete-button"
                            >
                                Delete
                            </button>
                        </li>
                    ))}
                    {overlays.length === 0 && (
                        <li className="no-overlays">No overlays yet. Add one above!</li>
                    )}
                </ul>
            </div>
        </div>
    );
}

export default ControlPanel;
