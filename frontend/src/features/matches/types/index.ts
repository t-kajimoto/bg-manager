/**
 * @fileoverview
 * 戦績（マッチ）機能に関連するデータモデルを定義します。
 */

export interface IMatchPlayer {
  id: string;
  match_id: string;
  user_id?: string | null;
  player_name: string;
  score?: string | null;
  rank?: number | null;
  is_winner: boolean;
  role?: string | null;
}

export interface IMatch {
  id: string;
  boardGameId: string;
  date: Date;
  location?: string | null;
  note?: string | null;
  createdBy: string;
  createdAt: Date;
  imageUrl?: string | null;
  players: IMatchPlayer[];
  boardGameName?: string;
}
