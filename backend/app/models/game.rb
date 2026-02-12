class Game < ApplicationRecord
  validates :title, presence: true
  validates :bgg_id, uniqueness: true, allow_nil: true

  has_many :library_entries
  has_many :play_logs
end
