
import React, { useState, useEffect } from 'react';
import { Post, User, Language } from '../types';
import { TranslationKey } from '../translations';
import { 
  HeartIcon, 
  MessageCircleIcon, 
  BadgeCheckIcon, 
  TrashIcon, 
  PinIcon,
  UploadIcon,
  UsersIcon
} from './Icons';

// --- Mock Data ---

const CURRENT_USER: User = {
  id: 'current_user',
  name: 'You',
  isExpert: false,
};

const INITIAL_USERS: Record<string, User> = {
  'u1': { id: 'u1', name: 'Dr. Sarah Green', isExpert: true },
  'u2': { id: 'u2', name: 'PlantDaddy99', isExpert: false },
  'u3': { id: 'u3', name: 'FernLover', isExpert: false },
};

const POSTS_EN: Post[] = [
  {
    id: 'p1',
    userId: 'u1',
    user: INITIAL_USERS['u1'],
    content: 'Tip of the day: Overwatering is the #1 killer of houseplants! Always check the top inch of soil before watering again. 💧 #PlantTips #ExpertAdvice',
    likes: 124,
    isLiked: false,
    comments: [
      { id: 'c1', userId: 'u2', user: INITIAL_USERS['u2'], text: 'This saved my pothos! Thanks doc.', timestamp: Date.now() - 3600000 }
    ],
    timestamp: Date.now() - 86400000,
    tags: ['PlantTips', 'ExpertAdvice'],
    isPinned: true,
  },
  {
    id: 'p2',
    userId: 'u2',
    user: INITIAL_USERS['u2'],
    content: 'My Monstera got a new leaf today! Look at those fenestrations. 😍',
    image: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&q=80&w=600',
    likes: 45,
    isLiked: true,
    comments: [],
    timestamp: Date.now() - 7200000,
    tags: ['Monstera', 'Success'],
  },
  {
    id: 'p3',
    userId: 'u3',
    user: INITIAL_USERS['u3'],
    content: 'Help! Why are the tips of my spider plant turning brown? I use tap water. 🤔',
    likes: 2,
    isLiked: false,
    comments: [
      { id: 'c2', userId: 'u1', user: INITIAL_USERS['u1'], text: 'Spider plants are sensitive to fluoride in tap water. Try using distilled or rain water instead!', timestamp: Date.now() - 1800000 }
    ],
    timestamp: Date.now() - 3600000,
    tags: ['Help', 'SpiderPlant'],
  }
];

const POSTS_FR: Post[] = [
  {
    id: 'p1',
    userId: 'u1',
    user: INITIAL_USERS['u1'],
    content: 'Astuce du jour : Le sur-arrosage est la cause n°1 de mortalité des plantes d\'intérieur ! Vérifiez toujours le premier centimètre de terre avant d\'arroser à nouveau. 💧 #ConseilPlante #Expert',
    likes: 124,
    isLiked: false,
    comments: [
      { id: 'c1', userId: 'u2', user: INITIAL_USERS['u2'], text: 'Ça a sauvé mon pothos ! Merci doc.', timestamp: Date.now() - 3600000 }
    ],
    timestamp: Date.now() - 86400000,
    tags: ['PlantTips', 'ExpertAdvice'],
    isPinned: true,
  },
  {
    id: 'p2',
    userId: 'u2',
    user: INITIAL_USERS['u2'],
    content: 'Mon Monstera a fait une nouvelle feuille aujourd\'hui ! Regardez ces fenestrations. 😍',
    image: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&q=80&w=600',
    likes: 45,
    isLiked: true,
    comments: [],
    timestamp: Date.now() - 7200000,
    tags: ['Monstera', 'Success'],
  },
  {
    id: 'p3',
    userId: 'u3',
    user: INITIAL_USERS['u3'],
    content: 'A l\'aide ! Pourquoi les pointes de ma plante araignée deviennent brunes ? J\'utilise de l\'eau du robinet. 🤔',
    likes: 2,
    isLiked: false,
    comments: [
      { id: 'c2', userId: 'u1', user: INITIAL_USERS['u1'], text: 'Les plantes araignées sont sensibles au fluorure de l\'eau du robinet. Essayez l\'eau distillée ou l\'eau de pluie !', timestamp: Date.now() - 1800000 }
    ],
    timestamp: Date.now() - 3600000,
    tags: ['Help', 'SpiderPlant'],
  }
];

interface CommunityFeedProps {
  lang: Language;
  t: (key: TranslationKey) => string;
}

export const CommunityFeed: React.FC<CommunityFeedProps> = ({ lang, t }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostImage, setNewPostImage] = useState<string | null>(null);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [isModMode, setIsModMode] = useState(false);

  // Initialize posts based on language
  useEffect(() => {
    // In a real app, this would fetch from an API with a language param
    // For demo, we just switch the mock data set, resetting state slightly
    setPosts(lang === 'fr' ? POSTS_FR : POSTS_EN);
  }, [lang]);

  // --- Handlers ---

  const handleLike = (postId: string) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          likes: post.isLiked ? post.likes - 1 : post.likes + 1,
          isLiked: !post.isLiked
        };
      }
      return post;
    }));
  };

  const handleDelete = (postId: string) => {
    if (confirm(t('delete_confirm'))) {
      setPosts(posts.filter(p => p.id !== postId));
    }
  };

  const handlePin = (postId: string) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return { ...post, isPinned: !post.isPinned };
      }
      return post;
    }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPostImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreatePost = () => {
    if (!newPostContent.trim()) return;

    const newPost: Post = {
      id: `new_${Date.now()}`,
      userId: CURRENT_USER.id,
      user: CURRENT_USER,
      content: newPostContent,
      image: newPostImage || undefined,
      likes: 0,
      isLiked: false,
      comments: [],
      timestamp: Date.now(),
      tags: [],
      isPinned: false,
    };

    setPosts([newPost, ...posts]);
    setNewPostContent("");
    setNewPostImage(null);
  };

  const handleAddComment = (postId: string) => {
    if (!commentText.trim()) return;

    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments: [
            ...post.comments,
            {
              id: `c_${Date.now()}`,
              userId: CURRENT_USER.id,
              user: CURRENT_USER,
              text: commentText,
              timestamp: Date.now()
            }
          ]
        };
      }
      return post;
    }));
    setCommentText("");
  };

  // --- Render ---

  // Sort: Pinned first, then by date descending
  const sortedPosts = [...posts].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return b.timestamp - a.timestamp;
  });

  return (
    <div className="max-w-3xl mx-auto pb-12 animate-fade-in">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <UsersIcon className="w-8 h-8 text-green-600" />
            {t('community_garden')}
          </h1>
          <p className="text-gray-500">{t('community_desc')}</p>
        </div>
        
        <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">{t('mod_mode')}</span>
            <button 
                onClick={() => setIsModMode(!isModMode)}
                className={`w-12 h-6 rounded-full transition-colors relative ${isModMode ? 'bg-green-600' : 'bg-gray-300'}`}
            >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${isModMode ? 'left-7' : 'left-1'}`}></div>
            </button>
        </div>
      </div>

      {/* Create Post Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-8">
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold flex-shrink-0">
            {CURRENT_USER.name.charAt(0)}
          </div>
          <div className="flex-grow">
            <textarea
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder={t('whats_on_your_mind')}
              className="w-full bg-gray-50 rounded-lg p-3 border border-transparent focus:border-green-500 focus:bg-white focus:outline-none transition-all resize-none h-24"
            />
            
            {newPostImage && (
              <div className="relative mt-2 inline-block">
                <img src={newPostImage} alt="Preview" className="h-32 rounded-lg object-cover border border-gray-200" />
                <button 
                  onClick={() => setNewPostImage(null)}
                  className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md text-red-500 hover:text-red-700"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="flex justify-between items-center mt-3">
              <label className="flex items-center gap-2 text-gray-500 hover:text-green-600 cursor-pointer px-2 py-1 rounded hover:bg-gray-100 transition-colors">
                <UploadIcon className="w-5 h-5" />
                <span className="text-sm font-medium">{t('add_photo')}</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>

              <button 
                onClick={handleCreatePost}
                disabled={!newPostContent.trim()}
                className="bg-green-600 text-white px-6 py-2 rounded-full font-medium shadow-sm hover:shadow-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {t('post_btn')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Posts Feed */}
      <div className="space-y-6">
        {sortedPosts.map(post => (
          <div key={post.id} className={`bg-white rounded-2xl shadow-sm border ${post.isPinned ? 'border-green-200 ring-1 ring-green-100' : 'border-gray-100'} overflow-hidden`}>
            {post.isPinned && (
               <div className="bg-green-50 px-4 py-1 text-xs font-bold text-green-700 flex items-center gap-1">
                 <PinIcon className="w-3 h-3 filled" filled /> {t('pinned_advice')}
               </div>
            )}
            
            <div className="p-5">
              {/* Post Header */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${post.user.isExpert ? 'bg-blue-600' : 'bg-gray-400'}`}>
                    {post.user.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <h3 className="font-bold text-gray-900">{post.user.name}</h3>
                      {post.user.isExpert && (
                        <BadgeCheckIcon className="w-4 h-4 text-blue-500" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(post.timestamp).toLocaleDateString()}
                      {post.user.isExpert && <span className="ml-2 px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold uppercase tracking-wider">{t('expert')}</span>}
                    </p>
                  </div>
                </div>

                {isModMode && (
                  <div className="flex gap-2">
                    <button 
                        onClick={() => handlePin(post.id)}
                        className={`p-1.5 rounded-full hover:bg-gray-100 ${post.isPinned ? 'text-green-600' : 'text-gray-400'}`}
                        title="Pin Post"
                    >
                        <PinIcon className="w-5 h-5" filled={post.isPinned} />
                    </button>
                    <button 
                        onClick={() => handleDelete(post.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full"
                        title="Delete Post"
                    >
                        <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Content */}
              <p className="text-gray-800 leading-relaxed whitespace-pre-wrap mb-3">{post.content}</p>
              
              {post.image && (
                <div className="mb-4 rounded-xl overflow-hidden bg-gray-100 max-h-96">
                  <img src={post.image} alt="Post attachment" className="w-full h-full object-cover" />
                </div>
              )}

              {/* Footer Actions */}
              <div className="flex items-center gap-6 pt-3 border-t border-gray-50">
                <button 
                  onClick={() => handleLike(post.id)}
                  className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${post.isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
                >
                  <HeartIcon className="w-5 h-5" filled={post.isLiked} />
                  {post.likes}
                </button>
                
                <button 
                  onClick={() => setExpandedPostId(expandedPostId === post.id ? null : post.id)}
                  className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${expandedPostId === post.id ? 'text-green-600' : 'text-gray-500 hover:text-green-600'}`}
                >
                  <MessageCircleIcon className="w-5 h-5" />
                  {post.comments.length} {t('comments')}
                </button>
              </div>
            </div>

            {/* Comments Section */}
            {expandedPostId === post.id && (
              <div className="bg-gray-50 p-5 border-t border-gray-100 animate-fade-in">
                <div className="space-y-4 mb-4">
                  {post.comments.length === 0 ? (
                    <p className="text-center text-gray-400 text-sm py-2">{t('no_comments')}</p>
                  ) : (
                    post.comments.map(comment => (
                      <div key={comment.id} className={`flex gap-3 ${comment.user.isExpert ? 'bg-blue-50/50 p-2 rounded-lg -mx-2' : ''}`}>
                         <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white ${comment.user.isExpert ? 'bg-blue-600' : 'bg-gray-400'}`}>
                            {comment.user.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                                <span className="font-bold text-sm text-gray-900">{comment.user.name}</span>
                                {comment.user.isExpert && <BadgeCheckIcon className="w-3 h-3 text-blue-500" />}
                                <span className="text-xs text-gray-400">• {new Date(comment.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                            <p className="text-sm text-gray-700 mt-0.5">{comment.text}</p>
                          </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder={t('write_comment')}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                    className="flex-grow px-4 py-2 rounded-full border border-gray-200 text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                  />
                  <button 
                    onClick={() => handleAddComment(post.id)}
                    disabled={!commentText.trim()}
                    className="text-green-600 font-bold text-sm px-3 hover:bg-green-50 rounded-full disabled:opacity-50 disabled:hover:bg-transparent"
                  >
                    {t('post_btn')}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
