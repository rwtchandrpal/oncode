// Badge colours for problem difficulty, shared by Home, the problem statement and the admin table.
export const getDifficultyColor = (difficulty) => {
  switch (difficulty?.toLowerCase()) {
    case 'easy': return 'bg-success/10 text-success border-success/20';
    case 'medium': return 'bg-warning/10 text-warning border-warning/20';
    case 'hard': return 'bg-error/10 text-error border-error/20';
    default: return 'bg-base-200 text-base-content/70 border-base-content/20';
  }
};
