import { Link } from 'react-router-dom';
import { ArrowRight, Leaf, Trash2 } from 'lucide-react';
import SeverityPill from './SeverityPill';
import { timeAgo } from '../utils/format';

function PlantCard({ plant, showSpecies = false, onDelete }) {
  const latest = plant.history[0];
  const name = plant.nickname || plant.species_name;

  return (
    <article className="pc-plantcard">
      <Link to={`/plants/${plant.id}`} className="pc-plantcard__imagewrap">
        {latest ? (
          <img src={latest.image} alt={`Latest scan of ${name}`} />
        ) : (
          <div className="pc-plantcard__placeholder"><Leaf size={48} /></div>
        )}
      </Link>

      {onDelete && (
        <button
          className="pc-plantcard__delete"
          aria-label={`Delete ${name}`}
          onClick={() => onDelete(plant)}
        >
          <Trash2 size={16} />
        </button>
      )}

      <div className="pc-plantcard__body">
        <h3>{name}</h3>
        {showSpecies && plant.nickname && <p className="pc-species">{plant.species_name}</p>}
        <p className="pc-last">{latest ? `Last scanned: ${timeAgo(latest.created_at)}` : 'Not scanned yet'}</p>
        <div className="pc-plantcard__footer">
          {latest ? <SeverityPill severity={latest.severity} /> : <span />}
          <Link to={`/plants/${plant.id}`} className="pc-link">
            Details <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </article>
  );
}

export default PlantCard;
