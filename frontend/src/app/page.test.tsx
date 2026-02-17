
import { render, screen, fireEvent } from '@testing-library/react';
import Home from './page';
import { useBoardgames } from '@/features/boardgames/hooks/useBoardgames';
import { IBoardGame } from '@/features/boardgames/types';

// ==========================================================================================
// テスト用のモック設定
// ==========================================================================================

// useBoardgamesフックをモック化します。
// これにより、実際のフックのロジック（Firestoreへのアクセスなど）を実行せず、
// テストケースごとに都合の良い値を返させることができます。
jest.mock('@/features/boardgames/hooks/useBoardgames');

// Headerコンポーネントをモック化します。
// Homeページのテストでは、Headerコンポーネント自体の動作は関心の対象外なので、
// 単純なプレースホルダーに置き換えて、テストをシンプルに保ちます。
jest.mock('./_components/Header', () => {
  return function DummyHeader() {
    return <header>ヘッダー</header>;
  };
});

// useBoardgamesのモックを型付けして、IDEの補完を効きやすくします。
const mockUseBoardgames = useBoardgames as jest.Mock;

// ==========================================================================================
// テスト用のダミーデータ
// ==========================================================================================

// テストで使用するボードゲームのダミーデータ
const mockBoardGames: IBoardGame[] = [
  {
    id: '1',
    name: 'カタン',
    min: 3,
    max: 4,
    time: 60,
    played: true,
    evaluation: 5,
    comment: '面白い',
    averageEvaluation: 4.5,
    anyPlayed: true,
    tags: ['戦略', '交渉'],
  },
  {
    id: '2',
    name: 'コードネーム',
    min: 2,
    max: 8,
    time: 15,
    played: false,
    evaluation: 0,
    comment: '',
    averageEvaluation: 4.8,
    anyPlayed: true,
    tags: ['チーム戦', 'パーティー'],
  },
];


// ==========================================================================================
// テストスイート
// ==========================================================================================

describe('Home Page', () => {
  // 各テストの前にモックをリセットします。
  beforeEach(() => {
    mockUseBoardgames.mockClear();
  });

  // ------------------------------------------------------------------------------------------
  // テストケース1: ローディング状態の表示
  // ------------------------------------------------------------------------------------------
  it('ローディング中はスケルトンが表示されること', () => {
    // フックがローディング状態を返すように設定
    mockUseBoardgames.mockReturnValue({
      boardGames: [],
      loading: true,
      error: null,
    });

    render(<Home />);

    // スケルトンコンポーネントが表示されていることを確認
    expect(screen.getByTestId('board-game-skeleton')).toBeInTheDocument();
  });

  // ------------------------------------------------------------------------------------------
  // テストケース2: エラー状態の表示
  // ------------------------------------------------------------------------------------------
  it('エラーが発生した場合はエラーメッセージが表示されること', () => {
    // フックがエラーオブジェクトを返すように設定
    mockUseBoardgames.mockReturnValue({
      boardGames: [],
      loading: false,
      error: new Error('Test Error'),
    });

    render(<Home />);

    // エラーメッセージの一部が含まれるテキストがドキュメント内に存在することを確認
    expect(screen.getByText(/データの読み込み中にエラーが発生しました/)).toBeInTheDocument();
    expect(screen.getByText(/Test Error/)).toBeInTheDocument();
  });

  // ------------------------------------------------------------------------------------------
  // テストケース3: データが空の場合の表示
  // ------------------------------------------------------------------------------------------
  it('ボードゲームのデータが空の場合はメッセージが表示されること', () => {
    // フックが空の配列を返すように設定
    mockUseBoardgames.mockReturnValue({
      boardGames: [],
      loading: false,
      error: null,
    });

    render(<Home />);

    // データが空の時に表示されるべきメッセージを確認
    expect(screen.getByText('登録されているボードゲームはありません。')).toBeInTheDocument();
  });

  // ------------------------------------------------------------------------------------------
  // テストケース4: データ取得成功時の表示
  // ------------------------------------------------------------------------------------------
  it('取得したボードゲームのリストが正しく表示されること', () => {
    // フックがダミーデータを返すように設定
    mockUseBoardgames.mockReturnValue({
      boardGames: mockBoardGames,
      loading: false,
      error: null,
    });

    render(<Home />);

    // --- 各ゲームの情報がカードとして表示されているかを確認 ---

    // ゲーム名
    expect(screen.getByText('カタン')).toBeInTheDocument();
    expect(screen.getByText('コードネーム')).toBeInTheDocument();

    // プレイ人数と時間
    expect(screen.getByText('3～4人')).toBeInTheDocument();
    expect(screen.getByText('60分')).toBeInTheDocument();
    expect(screen.getByText('2～8人')).toBeInTheDocument();
    expect(screen.getByText('15分')).toBeInTheDocument();

    // タグ
    expect(screen.getByText('戦略')).toBeInTheDocument();
    expect(screen.getByText('交渉')).toBeInTheDocument();
    expect(screen.getByText('チーム戦')).toBeInTheDocument();
    expect(screen.getByText('パーティー')).toBeInTheDocument();

    // 評価のラベル
    // getAllByTextで複数の要素を取得して、存在を確認
    expect(screen.getAllByText('あなたの評価').length).toBeGreaterThan(0);
    expect(screen.getAllByText('平均評価').length).toBeGreaterThan(0);
  });

  // ------------------------------------------------------------------------------------------
  // テストケース5: 検索機能
  // ------------------------------------------------------------------------------------------
  it('検索ボックスに入力するとリストがフィルタリングされること', () => {
    mockUseBoardgames.mockReturnValue({
      boardGames: mockBoardGames,
      loading: false,
      error: null,
    });
    render(<Home />);

    // 初期状態は2件
    expect(screen.getByText('カタン')).toBeInTheDocument();
    expect(screen.getByText('コードネーム')).toBeInTheDocument();

    // 検索入力
    const searchInput = screen.getByLabelText('検索');
    fireEvent.change(searchInput, { target: { value: 'カタン' } });

    // カタンのみ表示
    expect(screen.getByText('カタン')).toBeInTheDocument();
    expect(screen.queryByText('コードネーム')).not.toBeInTheDocument();
  });

  // ------------------------------------------------------------------------------------------
  // テストケース6: ガチャ機能
  // ------------------------------------------------------------------------------------------
  it('ガチャボタンをクリックするとダイアログが開くこと', () => {
    mockUseBoardgames.mockReturnValue({
      boardGames: mockBoardGames,
      loading: false,
      error: null,
    });
    render(<Home />);

    fireEvent.click(screen.getByRole('button', { name: 'ガチャ' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('ボドゲガチャ')).toBeInTheDocument();
  });
});
