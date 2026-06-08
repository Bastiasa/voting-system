import socket

udp = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

udp.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
udp.bind(("0.0.0.0", 8000))
udp.sendto(b'Ola mundo xd', ("255.255.255.255", 8999))
udp.close()