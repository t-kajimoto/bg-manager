// jest.setup.js
// このファイルをjest.config.jsのsetupFilesAfterEnvに設定することで、
// すべてのテストファイルでjest-domのマッチャー（例: .toBeInTheDocument()）が
// 自動的に利用できるようになります。
import '@testing-library/jest-dom';
