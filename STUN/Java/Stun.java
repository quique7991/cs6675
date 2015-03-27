import java.io.IOException;
import java.io.OutputStream;
import java.net.ServerSocket;
import java.net.Socket;
import java.util.regex.Pattern;

import javax.net.ServerSocketFactory;

/**
 * Basic STUN server
 * @author Andrew Wilder
 */
public class Stun {

	/** Default port for STUN server */
	private static final int DEFAULT_PORT = 12035;

	/** Print program usage */
	private static void print_usage() {
		System.out.println("Usage:");
		System.out.println("\tjava Stun [-p <port>]");
	}

	/** Listen on default port for connections */
	public static void main(String[] args) {

		int port = DEFAULT_PORT;

		// Parse arguments
		for(int i = 0; i < args.length; ++i) {
			switch(args[i++]) {
			case "-p":
				if(i < args.length) {
					if(Pattern.matches("\\d+", args[i])) {
						port = Integer.parseInt(args[i]);
						if(port > 0xFFFF) {
							System.out.println("Error: Port out of range: " + port);
							System.exit(1);
						}
					} else {
						System.out.println("Error: Invalid port: " + args[i]);
						System.exit(1);
					}
				} else {
					System.out.println("Error: Missing port");
					System.exit(1);
				}
				break;
			default:
				System.out.println("Error: Invalid argument: " + args[i]);
			case "-h":
				print_usage();
				System.exit(1);
			}
		}

		// Listen on the selected port
		try {
			ServerSocketFactory ssf = ServerSocketFactory.getDefault();
			ServerSocket ss = ssf.createServerSocket(port);
			System.out.println("Listening on port " + port + "...");
			while(true) {
				Socket s = ss.accept();
				String msg = s.getInetAddress().toString() + ":" + s.getPort();
				System.out.println("Request from: " + msg);
				OutputStream os = s.getOutputStream();
				os.write(msg.substring(1).getBytes("UTF-8"));
				os.write(0);
				os.close();
				s.close();
			}
		} catch(IOException e) {
			e.printStackTrace();
			System.exit(1);
		}
	}
}

