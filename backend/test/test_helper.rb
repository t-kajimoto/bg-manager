require "minitest/autorun"
require "minitest/mock"

# Load Core Domain files
Dir[File.expand_path("../../lib/core/entities/*.rb", __FILE__)].each { |f| require f }
Dir[File.expand_path("../../lib/core/repositories/*.rb", __FILE__)].each { |f| require f }
Dir[File.expand_path("../../lib/core/gateways/*.rb", __FILE__)].each { |f| require f }
Dir[File.expand_path("../../lib/core/use_cases/*.rb", __FILE__)].each { |f| require f }
