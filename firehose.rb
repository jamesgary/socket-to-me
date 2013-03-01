require 'em-websocket'
require 'json'

EM.run do
  EM::WebSocket.start(:host => "0.0.0.0", :port => 8080, :debug => false) do |ws|
    ws.onopen do |handshake|
      fps = handshake.query['fps']
      response = handshake.query['response']

      EM.add_periodic_timer(1.0 / fps.to_i) do
        ws.send(response);
      end
    end

    ws.onerror do |e|
      puts "Error: #{ e.message }"
      puts "Backtrace:\n\t#{e.backtrace.join("\n\t")}"
    end
  end

  puts 'Running...'
end

