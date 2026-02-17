/**
 * @fileoverview
 * このファイルは、Next.jsアプリケーション全体で使用されるデータモデル（インターフェース）を定義します。
 * TypeScriptの型システムを活用することで、データの構造を明確にし、コードの安全性と保守性を高めることを目的としています。
 * Firestoreのデータ構造と、Reactコンポーネントで実際に使用するデータの形を明確に分けて定義しています。
 */

/**
 * @interface IBoardGameData
 * @description
 * ボードゲームの基本的な静的情報を定義するインターフェースです。
 * このデータは、主にFirestoreの`boardGames`コレクションの各ドキュメントに対応します。
 * 一度登録されたら、管理者以外は変更しない普遍的な情報を保持します。
 */
export interface IBoardGameData {
  /** ボードゲームを一意に識別するためのID（FirestoreのドキュメントID） */
  id: string;
  /** ボードゲームの正式名称 */
  name: string;
  /** プレイ可能な最小人数 */
  min: number;
  /** プレイ可能な最大人数 */
  max: number;
  /** ゲームのおおよそのプレイ時間（分単位） */
  time: number;
  /** ゲームの分類や特徴を示すタグの配列（例: 「協力型」「戦略」など） */
  tags?: string[];
  /** このボードゲームを所有しているユーザーの名前（登録時のスナップショット） */
  ownerName?: string;
}

/**
 * @interface IBoardGameUser
 * @description
 * ユーザー一人ひとりの、特定のボードゲームに対するインタラクション情報を定義するインターフェースです。
 * ユーザーが編集可能な動的なデータを表します。
 */
export interface IBoardGameUser {
  /** ログインしているユーザーが、このゲームをプレイしたことがあるかを示すフラグ */
  played: boolean;
  /** ログインしているユーザーによる、このゲームへの評価（1から5の5段階評価） */
  evaluation: number;
  /** ユーザーが残したひとことコメント */
  comment?: string;
}

/**
 * @interface IBoardGameUserFirestore
 * @description
 * Firestoreの`userBoardGames`コレクションに保存される、ユーザーごとのプレイ状況データの完全な構造です。
 * `IBoardGameUser`のデータに加えて、どのユーザーがどのボードゲームに対する情報なのかを紐付けるためのIDが含まれます。
 */
export interface IBoardGameUserFirestore extends IBoardGameUser {
  /** この記録を所有するユーザーのID (Firebase AuthのUID) */
  userId: string;
  /** 対象となるボードゲームのID */
  boardGameId: string;
}

/**
 * @interface IBoardGame
 * @description
 * 実際にReactコンポーネント、特にリスト表示画面で利用するために、複数の情報を結合した包括的なインターフェースです。
 * ボードゲームの基本情報(`IBoardGameData`)と、ログインユーザーのプレイ状況(`IBoardGameUser`)を組み合わせ、
 * さらにカスタムフックによって動的に計算される追加情報（平均評価など）も保持します。
 */
export interface IBoardGame extends IBoardGameData, IBoardGameUser {
  // IBoardGameData と IBoardGameUser からすべてのプロパティを継承します。
  // 以下は、このインターフェース独自の追加プロパティです。

  /** 全ユーザーの評価を平均した値（小数点第一位まで） */
  averageEvaluation?: number;
  /** 参加しているユーザーのうち、誰か一人でもこのゲームをプレイしたことがあるかを示すフラグ */
  anyPlayed?: boolean;
}
