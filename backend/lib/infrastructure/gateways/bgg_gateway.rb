require 'faraday'
require 'nokogiri'

module Infrastructure
  module Gateways
    class BggGateway
      BASE_URL = 'https://boardgamegeek.com/xmlapi2'

      def search(query)
        response = Faraday.get("#{BASE_URL}/search", { query: query, type: 'boardgame' })
        return [] unless response.success?

        parse_search_results(response.body)
      end

      def find_by_id(id)
        response = Faraday.get("#{BASE_URL}/thing", { id: id })
        return nil unless response.success?

        parse_thing_result(response.body)
      end

      private

      def parse_search_results(xml)
        doc = Nokogiri::XML(xml)
        doc.xpath('//item').map do |item|
          Core::Entities::Game.new(
            id: nil, # External result doesn't have local ID
            title: item.xpath('name/@value').text,
            bgg_id: item.xpath('@id').text,
            image_url: nil,
            min_players: nil,
            max_players: nil
          )
        end
      end

      def parse_thing_result(xml)
        doc = Nokogiri::XML(xml)
        item = doc.at_xpath('//item')
        return nil unless item

        Core::Entities::Game.new(
          id: nil,
          title: item.at_xpath("name[@type='primary']/@value")&.text,
          image_url: item.at_xpath('image')&.text,
          min_players: item.at_xpath('minplayers/@value')&.text&.to_i,
          max_players: item.at_xpath('maxplayers/@value')&.text&.to_i,
          bgg_id: item.xpath('@id').text
        )
      end
    end
  end
end
