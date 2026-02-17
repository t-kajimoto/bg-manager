# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.1].define(version: 2024_05_23_000006) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pgcrypto"
  enable_extension "plpgsql"

  create_table "friendships", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "profile_id", null: false
    t.uuid "friend_id", null: false
    t.string "status", default: "pending", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["friend_id"], name: "index_friendships_on_friend_id"
    t.index ["profile_id", "friend_id"], name: "index_friendships_on_profile_id_and_friend_id", unique: true
    t.index ["profile_id"], name: "index_friendships_on_profile_id"
  end

  create_table "games", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "title", null: false
    t.string "image_url"
    t.integer "min_players"
    t.integer "max_players"
    t.string "bgg_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["bgg_id"], name: "index_games_on_bgg_id", unique: true
    t.index ["title"], name: "index_games_on_title"
  end

  create_table "library_entries", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "profile_id", null: false
    t.uuid "game_id", null: false
    t.string "status", null: false
    t.integer "rating"
    t.text "comment"
    t.string "visibility", default: "public"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["game_id"], name: "index_library_entries_on_game_id"
    t.index ["profile_id", "game_id"], name: "index_library_entries_on_profile_id_and_game_id", unique: true
    t.index ["profile_id"], name: "index_library_entries_on_profile_id"
  end

  create_table "play_logs", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "profile_id", null: false
    t.uuid "game_id", null: false
    t.date "played_on", null: false
    t.text "memo"
    t.string "image_path"
    t.string "visibility", default: "public"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["game_id"], name: "index_play_logs_on_game_id"
    t.index ["profile_id"], name: "index_play_logs_on_profile_id"
  end

  create_table "profiles", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "username", null: false
    t.string "avatar_url"
    t.string "default_visibility", default: "public"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  add_foreign_key "friendships", "profiles"
  add_foreign_key "friendships", "profiles", column: "friend_id"
  add_foreign_key "library_entries", "games"
  add_foreign_key "library_entries", "profiles"
  add_foreign_key "play_logs", "games"
  add_foreign_key "play_logs", "profiles"
end
