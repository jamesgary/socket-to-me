require 'em-websocket'
require 'json'

EM.run do
  EM::WebSocket.start(:host => "0.0.0.0", :port => 81, :debug => false) do |ws|
    response = ''

    ws.onopen do |handshake|
      response = handshake.query['pong']
    end

    ws.onmessage do |ws_data|
      ws.send(response)
    end

    ws.onerror do |e|
      puts "Error: #{ e.message }"
      puts "Backtrace:\n\t#{e.backtrace.join("\n\t")}"
    end
  end

  puts 'Running...'
end
