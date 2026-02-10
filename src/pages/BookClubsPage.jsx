import { useState } from 'react';
import { useApp } from '../context/AppContext';
import BookCard from '../components/BookCard';
import { Users, MessageCircle, BookOpen, ChevronDown, ChevronUp, Send, Crown, Lock, Globe } from 'lucide-react';

function formatDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getInitials(name) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

const avatarColors = [
  'bg-indigo-500',
  'bg-emerald-500',
  'bg-rose-500',
  'bg-amber-500',
  'bg-cyan-500',
  'bg-violet-500',
  'bg-pink-500',
  'bg-teal-500',
];

function getAvatarColor(userId) {
  return avatarColors[(userId - 1) % avatarColors.length];
}

export default function BookClubsPage() {
  const { allClubs, user, getBookById, getUserById, joinClub, leaveClub, addDiscussion, addReply } = useApp();
  const [activeTab, setActiveTab] = useState('my');
  const [expandedDiscussions, setExpandedDiscussions] = useState({});
  const [newDiscussionTexts, setNewDiscussionTexts] = useState({});
  const [replyTexts, setReplyTexts] = useState({});

  const myClubs = allClubs.filter((club) => club.members.includes(user.id));
  const displayedClubs = activeTab === 'my' ? myClubs : allClubs;

  const toggleDiscussions = (clubId) => {
    setExpandedDiscussions((prev) => ({ ...prev, [clubId]: !prev[clubId] }));
  };

  const handleAddDiscussion = (clubId) => {
    const text = newDiscussionTexts[clubId];
    if (!text || !text.trim()) return;
    addDiscussion(clubId, text.trim());
    setNewDiscussionTexts((prev) => ({ ...prev, [clubId]: '' }));
  };

  const handleAddReply = (clubId, discussionId) => {
    const key = `${clubId}-${discussionId}`;
    const text = replyTexts[key];
    if (!text || !text.trim()) return;
    addReply(clubId, discussionId, text.trim());
    setReplyTexts((prev) => ({ ...prev, [key]: '' }));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-text">Book Clubs</h1>
        <p className="text-text-muted mt-1">Read together, discuss, repeat.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 mb-8 border-b border-surface-light">
        <button
          onClick={() => setActiveTab('my')}
          className={`pb-3 text-sm font-medium transition-colors ${
            activeTab === 'my'
              ? 'text-accent border-b-2 border-accent'
              : 'text-text-muted hover:text-text'
          }`}
        >
          My Clubs
        </button>
        <button
          onClick={() => setActiveTab('discover')}
          className={`pb-3 text-sm font-medium transition-colors ${
            activeTab === 'discover'
              ? 'text-accent border-b-2 border-accent'
              : 'text-text-muted hover:text-text'
          }`}
        >
          Discover Clubs
        </button>
      </div>

      {/* Club Cards */}
      <div className="space-y-6">
        {displayedClubs.map((club) => {
          const isMember = club.members.includes(user.id);
          const currentBook = getBookById(club.currentBook);
          const isExpanded = expandedDiscussions[club.id];

          return (
            <div
              key={club.id}
              className="bg-surface-light rounded-xl p-6"
              style={{ borderLeft: `4px solid ${club.coverColor}` }}
            >
              {/* Club Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold text-text">{club.name}</h2>
                    {club.isPublic ? (
                      <span className="flex items-center gap-1 text-xs text-text-muted bg-surface rounded-full px-2 py-0.5">
                        <Globe className="w-3 h-3" />
                        Public
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-text-muted bg-surface rounded-full px-2 py-0.5">
                        <Lock className="w-3 h-3" />
                        Private
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-text-muted mt-1">
                    <Users className="w-4 h-4" />
                    <span>{club.members.length} members</span>
                  </div>
                </div>

                {/* Join/Leave Button */}
                <div>
                  {isMember ? (
                    <button
                      onClick={() => leaveClub(club.id)}
                      className="px-4 py-1.5 text-sm rounded-lg border border-text-muted text-text-muted hover:border-red-400 hover:text-red-400 transition-colors"
                    >
                      Leave
                    </button>
                  ) : club.isPublic ? (
                    <button
                      onClick={() => joinClub(club.id)}
                      className="px-4 py-1.5 text-sm rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors"
                    >
                      Join Club
                    </button>
                  ) : (
                    <button
                      disabled
                      className="px-4 py-1.5 text-sm rounded-lg bg-surface text-text-muted cursor-not-allowed opacity-60"
                    >
                      <Lock className="w-3 h-3 inline mr-1" />
                      Private Club
                    </button>
                  )}
                </div>
              </div>

              {/* Description */}
              <p className="text-text-muted text-sm mb-4">{club.description}</p>

              {/* Schedule */}
              <div className="text-sm text-text-muted mb-4">
                <span className="font-medium text-text">Schedule:</span> {club.schedule}
              </div>

              {/* Currently Reading */}
              {currentBook && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-text mb-2 flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    Currently Reading
                  </h3>
                  <div className="flex items-center gap-4">
                    <BookCard book={currentBook} size="sm" showInfo={false} />
                    <div>
                      <p className="font-medium text-text">{currentBook.title}</p>
                      <p className="text-sm text-text-muted">{currentBook.author}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Members */}
              <div className="mb-4">
                <h3 className="text-sm font-medium text-text mb-2">Members</h3>
                <div className="flex flex-wrap gap-2">
                  {club.members.map((memberId) => {
                    const member = getUserById(memberId);
                    if (!member) return null;
                    const isAdmin = memberId === club.admin;
                    return (
                      <div key={memberId} className="flex items-center gap-1.5" title={member.displayName}>
                        <div className="relative">
                          <div
                            className={`w-8 h-8 rounded-full ${getAvatarColor(memberId)} flex items-center justify-center text-white text-xs font-medium`}
                          >
                            {getInitials(member.displayName)}
                          </div>
                          {isAdmin && (
                            <Crown className="w-3 h-3 text-amber-400 absolute -top-1 -right-1" />
                          )}
                        </div>
                        <span className="text-sm text-text-muted">{member.displayName.split(' ')[0]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Discussions (only for members) */}
              {isMember && (
                <div>
                  <button
                    onClick={() => toggleDiscussions(club.id)}
                    className="flex items-center gap-2 text-sm font-medium text-text hover:text-accent transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Discussions ({club.discussions.length})
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="mt-4 space-y-4">
                      {/* New Discussion Input */}
                      <div className="bg-surface rounded-lg p-3">
                        <textarea
                          value={newDiscussionTexts[club.id] || ''}
                          onChange={(e) =>
                            setNewDiscussionTexts((prev) => ({ ...prev, [club.id]: e.target.value }))
                          }
                          placeholder="Start a new discussion..."
                          className="w-full bg-transparent text-text text-sm placeholder-text-muted resize-none outline-none min-h-[60px]"
                          rows={2}
                        />
                        <div className="flex justify-end mt-2">
                          <button
                            onClick={() => handleAddDiscussion(club.id)}
                            className="px-4 py-1.5 text-sm rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors"
                          >
                            Post
                          </button>
                        </div>
                      </div>

                      {/* Discussion List */}
                      {club.discussions.map((discussion) => {
                        const discussionUser = getUserById(discussion.userId);
                        const replyKey = `${club.id}-${discussion.id}`;
                        return (
                          <div key={discussion.id} className="bg-surface rounded-lg p-4">
                            {/* Discussion Header */}
                            <div className="flex items-center gap-2 mb-2">
                              <div
                                className={`w-7 h-7 rounded-full ${getAvatarColor(discussion.userId)} flex items-center justify-center text-white text-xs font-medium`}
                              >
                                {discussionUser ? getInitials(discussionUser.displayName) : '?'}
                              </div>
                              <span className="text-sm font-medium text-text">
                                {discussionUser ? discussionUser.displayName : 'Unknown'}
                              </span>
                              <span className="text-xs text-text-muted">{formatDate(discussion.date)}</span>
                            </div>

                            {/* Discussion Text */}
                            <p className="text-sm text-text mb-3">{discussion.text}</p>

                            {/* Replies */}
                            {discussion.replies.length > 0 && (
                              <div className="ml-4 border-l-2 border-surface-light pl-4 space-y-3 mb-3">
                                {discussion.replies.map((reply, idx) => {
                                  const replyUser = getUserById(reply.userId);
                                  return (
                                    <div key={idx}>
                                      <div className="flex items-center gap-2 mb-1">
                                        <div
                                          className={`w-6 h-6 rounded-full ${getAvatarColor(reply.userId)} flex items-center justify-center text-white text-[10px] font-medium`}
                                        >
                                          {replyUser ? getInitials(replyUser.displayName) : '?'}
                                        </div>
                                        <span className="text-sm font-medium text-text">
                                          {replyUser ? replyUser.displayName : 'Unknown'}
                                        </span>
                                        <span className="text-xs text-text-muted">
                                          {formatDate(reply.date)}
                                        </span>
                                      </div>
                                      <p className="text-sm text-text-muted">{reply.text}</p>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Reply Input */}
                            <div className="flex items-center gap-2 mt-2">
                              <input
                                type="text"
                                value={replyTexts[replyKey] || ''}
                                onChange={(e) =>
                                  setReplyTexts((prev) => ({ ...prev, [replyKey]: e.target.value }))
                                }
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleAddReply(club.id, discussion.id);
                                }}
                                placeholder="Write a reply..."
                                className="flex-1 bg-surface-light text-text text-sm rounded-lg px-3 py-1.5 placeholder-text-muted outline-none focus:ring-1 focus:ring-accent"
                              />
                              <button
                                onClick={() => handleAddReply(club.id, discussion.id)}
                                className="p-1.5 text-text-muted hover:text-accent transition-colors"
                              >
                                <Send className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {displayedClubs.length === 0 && (
        <div className="text-center py-16 text-text-muted">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-lg">
            {activeTab === 'my'
              ? "You haven't joined any clubs yet."
              : 'No clubs available.'}
          </p>
          {activeTab === 'my' && (
            <button
              onClick={() => setActiveTab('discover')}
              className="mt-3 text-accent hover:underline text-sm"
            >
              Discover clubs to join
            </button>
          )}
        </div>
      )}
    </div>
  );
}
