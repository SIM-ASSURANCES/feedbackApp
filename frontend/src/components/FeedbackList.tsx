import { useState } from 'react';

interface Feedback {
  id: string;
  content: string;
  submitted_at: string;
  recipient_name?: string;
  rating?: number;
}

interface FeedbackListProps {
  feedbacks: Feedback[];
}

function FeedbackCard({ item }: { item: Feedback }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const maxLength = 220; // Plus de place en largeur, on augmente la limite de coupure
  
  const isLong = item.content.length > maxLength;
  const displayContent = isExpanded 
    ? item.content 
    : (isLong ? `${item.content.substring(0, maxLength)}...` : item.content);

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '24px 28px' }}>
      <div>
        <p style={{ color: '#0f172a', fontSize: '1.05rem', lineHeight: '1.6', margin: '0 0 16px 0' }}>
          "{displayContent}"
          {isLong && (
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              style={{
                background: 'none',
                border: 'none',
                color: '#004B9C',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '0 0 0 6px',
                fontSize: '0.9rem',
                textDecoration: 'underline',
                display: 'inline-block'
              }}
            >
              {isExpanded ? 'Voir moins' : 'Lire la suite'}
            </button>
          )}
        </p>
        {item.rating && item.rating > 0 ? (
          <div style={{ color: '#FF9500', fontSize: '1.1rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>
              {'★'.repeat(Math.min(item.rating, item.rating > 5 ? 10 : 5))}
              {'☆'.repeat(Math.max(0, (item.rating > 5 ? 10 : 5) - item.rating))}
            </span>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>
              ({item.rating}/{item.rating > 5 ? 10 : 5})
            </span>
          </div>
        ) : null}
      </div>
      <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        {item.recipient_name && (
          <span style={{ color: '#51AEE2', fontWeight: 600, fontSize: '0.9rem' }}>
            ✓ Pour {item.recipient_name}
          </span>
        )}
        <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
          {new Date(item.submitted_at).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
      </div>
    </div>
  );
}

function FeedbackList({ feedbacks }: FeedbackListProps) {
  if (feedbacks.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
        <p style={{ fontSize: '1.1rem', color: '#94a3b8' }}>Aucun retour pour le moment.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '60px' }}>
      {feedbacks.map((item) => (
        <FeedbackCard key={item.id} item={item} />
      ))}
    </div>
  );
}

export default FeedbackList;

