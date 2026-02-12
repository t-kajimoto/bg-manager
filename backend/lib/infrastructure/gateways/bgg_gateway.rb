require 'faraday'
require 'nokogiri'

module Infrastructure
  module Gateways
    # BggGatewayクラス
    # Core::Gateways::GameGateway インターフェースを満たす具象クラスです。
    # 外部のBoardGameGeek XML API2 (BGG API) との通信を担当します。
    # ここでは、外部APIの仕様変更（エンドポイント、パラメータ、レスポンス形式）を吸収し、
    # Core層に対して安定したインターフェースを提供します（Anti-Corruption Layerの一種）。
    class BggGateway
      BASE_URL = 'https://boardgamegeek.com/xmlapi2'

      # ゲームを検索するメソッド（外部API呼び出し）
      # @param query [String] 検索クエリ
      # @return [Array<Core::Entities::Game>] 見つかったゲームの配列
      def search(query)
        # Faradayを使ってHTTP GETリクエストを送信
        # クエリパラメータとして { query: query, type: 'boardgame' } を渡しています。
        response = Faraday.get("#{BASE_URL}/search", { query: query, type: 'boardgame' })

        # レスポンスが成功（200 OK）でない場合は空配列を返します。
        return [] unless response.success?

        # 成功した場合は、レスポンスボディ（XML）を解析してEntityの配列に変換します。
        parse_search_results(response.body)
      end

      # ゲーム詳細を取得するメソッド（外部API呼び出し）
      # @param id [String] BGG ID
      # @return [Core::Entities::Game, nil] ゲームが見つかった場合はEntity、なければnil
      def find_by_id(id)
        # BGG APIのThingエンドポイントを使って詳細情報を取得
        response = Faraday.get("#{BASE_URL}/thing", { id: id })
        return nil unless response.success?

        parse_thing_result(response.body)
      end

      private

      # XMLレスポンス（検索結果）をパースしてEntityのリストに変換するヘルパーメソッド
      # Nokogiriライブラリを使用してXML構造を解析します。
      def parse_search_results(xml)
        doc = Nokogiri::XML(xml)
        # XPathを使って <item> 要素をすべて取得し、ループ処理
        doc.xpath('//item').map do |item|
          Core::Entities::Game.new(
            id: nil, # 外部データなので、アプリケーション内のID（UUID）はまだありません
            title: item.xpath('name/@value').text, # XPathで属性値を取得
            bgg_id: item.xpath('@id').text,
            image_url: nil,
            min_players: nil,
            max_players: nil
          )
        end
      end

      # XMLレスポンス（詳細情報）をパースして単一のEntityに変換するヘルパーメソッド
      def parse_thing_result(xml)
        doc = Nokogiri::XML(xml)
        item = doc.at_xpath('//item') # 最初の <item> 要素を取得
        return nil unless item

        Core::Entities::Game.new(
          id: nil,
          # name要素のうち、type='primary'（メインタイトル）のvalue属性を取得
          title: item.at_xpath("name[@type='primary']/@value")&.text,
          image_url: item.at_xpath('image')&.text,
          # 数値データは .to_i で整数に変換
          min_players: item.at_xpath('minplayers/@value')&.text&.to_i,
          max_players: item.at_xpath('maxplayers/@value')&.text&.to_i,
          bgg_id: item.xpath('@id').text
        )
      end
    end
  end
end
