interface TrialTimerProps {
    seconds: number;
}

export const TrialTimer = ({ seconds }: TrialTimerProps) => {
    return (
        <div style={{
            position: 'absolute',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 50,
            pointerEvents: 'none'
        }}>
            <div style={{
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(4px)',
                padding: '6px 16px',
                borderRadius: '99px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
            }}>
                <div style={{
                    width: '8px',
                    height: '8px',
                    backgroundColor: seconds <= 5 ? '#f87171' : '#fbbf24',
                    borderRadius: '50%',
                    boxShadow: `0 0 10px ${seconds <= 5 ? '#f87171' : '#fbbf24'}`
                }} />
                <span style={{
                    color: 'white',
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    letterSpacing: '0.05em'
                }}>
                    FREE TRIAL: {seconds}s
                </span>
            </div>
        </div>
    );
};
