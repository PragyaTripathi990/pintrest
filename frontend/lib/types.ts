export interface UserBrief {
  id: number;
  username: string;
  full_name: string;
  avatar: string | null;
}

export interface Pin {
  id: number;
  title: string;
  description: string;
  alt_text: string;
  link: string;
  source_name: string;
  image: string | null;
  width: number;
  height: number;
  dominant_color: string;
  created_at: string;
  uploader: UserBrief;
  save_count: number;
  reaction_count: number;
  comment_count: number;
  viewer_has_saved: boolean;
  viewer_reaction: string | null;
}

export interface PinPage {
  items: Pin[];
  next_cursor: number | null;
}

export interface Board {
  id: number;
  name: string;
  slug: string;
  owner: UserBrief;
  pin_count: number;
  section_count: number;
  cover_images: string[];
  is_secret: boolean;
  created_at: string;
  description?: string;
}

export interface UserProfile extends UserBrief {
  bio: string;
  website: string;
  created_at: string;
  followers_count: number;
  following_count: number;
  pin_count: number;
  board_count: number;
  is_following: boolean;
}

export interface Me extends UserBrief {
  email: string;
  bio: string;
  website: string;
  is_business: boolean;
  created_at: string;
}

export interface Comment {
  id: number;
  text: string;
  created_at: string;
  user: UserBrief;
  parent_id: number | null;
  reaction_count: number;
  viewer_reacted: boolean;
}

export interface Topic {
  id: number;
  name: string;
  slug: string;
  image: string | null;
  cover_image: string | null;
  category: string;
}
