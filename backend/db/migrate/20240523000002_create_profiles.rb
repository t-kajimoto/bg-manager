class CreateProfiles < ActiveRecord::Migration[7.2]
  def change
    create_table :profiles, id: :uuid do |t|
      t.string :username, null: false
      t.string :avatar_url
      t.string :default_visibility, default: 'public'

      t.timestamps
    end

    # Ideally, id would be a foreign key to auth.users, but here it's just a PK
  end
end
