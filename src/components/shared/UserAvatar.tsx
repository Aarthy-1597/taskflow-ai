import { useApp } from '@/context/AppContext';

export function UserAvatar({ userId, size = 'sm' }: { userId: string; size?: 'sm' | 'md' }) {
  const { getTeamMember } = useApp();
  const member = getTeamMember(userId);
  if (!member) return null;

  const initials = member.name.split(' ').map(n => n[0]).join('');
  const sizeClass = size === 'sm' ? 'h-6 w-6 text-[10px]' : 'h-8 w-8 text-xs';

  return (
    <div
      className={`${sizeClass} rounded-full bg-primary/20 flex items-center justify-center font-display font-bold text-primary shrink-0`}
      title={member.name}
    >
      {initials}
    </div>
  );
}
