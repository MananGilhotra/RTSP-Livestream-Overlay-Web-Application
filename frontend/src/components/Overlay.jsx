import { useRef, useState } from 'react';
import Draggable from 'react-draggable';
import { Resizable } from 'react-resizable';
import { updateOverlay } from '../services/api';
import 'react-resizable/css/styles.css';

/**
 * Overlay Component
 * A draggable and resizable overlay element that displays text or images.
 */
function Overlay({ overlay, onUpdate }) {
    const nodeRef = useRef(null);
    const [imageError, setImageError] = useState(false);

    // Handle drag stop - save new position to backend
    const handleDragStop = async (e, data) => {
        try {
            const updated = await updateOverlay(overlay._id, {
                x: Math.round(data.x),
                y: Math.round(data.y),
            });
            onUpdate(updated);
        } catch (error) {
            console.error('Failed to update overlay position:', error);
        }
    };

    // Handle resize stop - save new dimensions to backend
    const handleResizeStop = async (e, { size }) => {
        try {
            const updated = await updateOverlay(overlay._id, {
                width: Math.round(size.width),
                height: Math.round(size.height),
            });
            onUpdate(updated);
        } catch (error) {
            console.error('Failed to update overlay dimensions:', error);
        }
    };

    // Handle image load error
    const handleImageError = () => {
        setImageError(true);
    };

    // Render content based on overlay type
    const renderContent = () => {
        if (overlay.type === 'text') {
            return (
                <div className="overlay-text">
                    {overlay.content}
                </div>
            );
        } else if (overlay.type === 'image') {
            if (imageError) {
                return (
                    <div className="overlay-image-error">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                        </svg>
                        <span>Image failed to load</span>
                    </div>
                );
            }
            return (
                <img
                    src={overlay.content}
                    alt="Overlay"
                    className="overlay-image"
                    draggable={false}
                    onError={handleImageError}
                />
            );
        }
        return null;
    };

    return (
        <Draggable
            nodeRef={nodeRef}
            defaultPosition={{ x: overlay.x, y: overlay.y }}
            onStop={handleDragStop}
            bounds="parent"
        >
            <div ref={nodeRef} style={{ position: 'absolute' }}>
                <Resizable
                    width={overlay.width}
                    height={overlay.height}
                    onResizeStop={handleResizeStop}
                    minConstraints={[50, 30]}
                    maxConstraints={[800, 600]}
                >
                    <div
                        className="overlay-container"
                        style={{
                            width: overlay.width,
                            height: overlay.height,
                        }}
                    >
                        {renderContent()}
                    </div>
                </Resizable>
            </div>
        </Draggable>
    );
}

export default Overlay;
