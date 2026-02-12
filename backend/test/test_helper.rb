# テストヘルパーファイル
# すべてのテストファイルから読み込まれ、共通の設定や依存関係のロードを行います。
require "minitest/autorun" # Minitestフレームワークを読み込み、テストの自動実行を有効にします。
require "minitest/mock"    # モック機能（Minitest::Mock）を使うためのライブラリを読み込みます。

# Core Domainのファイルをロードします。
# Railsのオートロード機構を使わずに、純粋なRubyコードとしてテストを実行するため、明示的にrequireしています。
# Dir[pattern]: 指定したパターンに一致するファイルパスの配列を返します。
# File.expand_path: 相対パスを絶対パスに変換します。
# __FILE__: 現在のファイル（test_helper.rb）のパスを表します。
Dir[File.expand_path("../../lib/core/entities/*.rb", __FILE__)].each { |f| require f }
Dir[File.expand_path("../../lib/core/repositories/*.rb", __FILE__)].each { |f| require f }
Dir[File.expand_path("../../lib/core/gateways/*.rb", __FILE__)].each { |f| require f }
Dir[File.expand_path("../../lib/core/use_cases/*.rb", __FILE__)].each { |f| require f }
