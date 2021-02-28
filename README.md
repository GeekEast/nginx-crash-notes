### Install Nginx

```jsx
brew install nginx

Docroot is: /usr/local/var/www

The default port has been set in /usr/local/etc/nginx/nginx.conf to 8080 so that
nginx can run without sudo.

nginx will load all files in /usr/local/etc/nginx/servers/.

To have launchd start nginx now and restart at login:
  brew services start nginx

Or, if you don't want/need a background service you can just run:
  nginx

To stop nginx:
	nginx -s stop

To validate config before start:
	nginx -t

To reload nginx:
	nginx -s reload
```

### Nginx as Static Web Server

- `nginx.conf` v1

```
http {
    server {
        listen 8080;
    }
}

events {

}
```

- `nginx conf` v2: static web server

```
http {
    server {
        listen 8080;
        # static server file location
        root /Users/james/Documents/server/;
    }
}

events {

}
```

Server folder stucture

- server
    - site1
        - index.html
    - site2
        - index.html
    - index.html

try visit `localhost:8080` , `localhost:8080/site1` , `localhost:8080/site2`

- `nginx.conf` v3

```
http {
    server {
        listen 8080;
        # static server file location
        # will load site1 and site2 under the server directory
        root /Users/james/Documents/server;
        # specify sub-directory manually
        location /images {
            # the real url is /Users/james/Documents/images
            root /Users/james/Documents;
        }
    }
}

events {

}
```

create a folder `/Users/james/Documents/images` , then visit `localhost:8080/images`

- `nginx.conf` v4

```
http {
    server {
        listen 8080;
        # static server file location
        # will load site1 and site2 under the server directory
        root /Users/james/Documents/server;
        # specify sub-directory manually
        location /images {
            # the real url is /Users/james/Documents/images
            root /Users/james/Documents;
        }

        # use regular expression
        location ~ .jpg$ {
            return 403;
        }
    }
}

events {

}
```

- `nginx.conf` v4: redirecting

```
http {
    server {
        listen 8080;
        # static server file location
        # will load site1 and site2 under the server directory
        root /Users/james/Documents/server;
        # specify sub-directory manually
        location /images {
            # the real url is /Users/james/Documents/images
            root /Users/james/Documents;
        }

        # use regular expression to return 404 for all jpg files
        location ~ .jpg$ {
            return 403;
        }
    }

    server {
        listen 8888;
        location / {
            # redirecting
            proxy_pass http://localhost:8080/;
        }

        location /img {
            proxy_pass http://localhost:8080/images;
        }
    }
}

events {

}
```

 try visit `[localhost:8888](http://localhost:8888)` and `[localhost:8888/images](http://localhost:8888/images)` and `[localhost:8888/img](http://localhost:8888/img)` 

### Layer 7 (http) Proxy

```
docker build -t nodeapp .
docker run -p 2222:9999 -e APPID=2222 -d nodeapp
docker run -p 3333:9999 -e APPID=3333 -d nodeapp
docker run -p 4444:9999 -e APPID=4444 -d nodeapp
docker run -p 5555:9999 -e APPID=5555 -d nodeapp
```

- `nginx.conf` v5

```
http {
		# round-robin load balancer
    upstream allbackend {
        server 127.0.0.1:2222;
        server 127.0.0.1:3333;
        server 127.0.0.1:4444;
        server 127.0.0.1:5555;
    }
    server {
        listen 80;
        location / {
            proxy_pass http://allbackend/;
        }
    }
}

events {}
```

- `nginx.conf` v6

```
http {
    upstream allbackend {
				# another load balancing method: same client ip always get the same server response
				# different ip get different server response
        ip_hash;
        server 127.0.0.1:2222;
        server 127.0.0.1:3333;
        server 127.0.0.1:4444;
        server 127.0.0.1:5555;
    }
    server {
        listen 80;
        location / {
            proxy_pass http://allbackend/;
        }

    }
}

events {

}
```

- `nginx.conf` v7: **multiple** upstreams is supported in **Layer 7** (http), but not at **Layer 4** (tcp)

```
http {
    upstream allbackend {
        # another load balancing method: same client ip always get the same server response
        # different ip get different server response
        ip_hash;
        server 127.0.0.1:2222;
        server 127.0.0.1:3333;
        server 127.0.0.1:4444;
        server 127.0.0.1:5555;
    }

    upstream app1backend {
        server 127.0.0.1:2222;
        server 127.0.0.1:3333;
    }

    upstream app2backend {
        server 127.0.0.1:2222;
        server 127.0.0.1:3333;

    }
    server {
        listen 80;
        location / {
            proxy_pass http://allbackend/;
        }
        location /app1 {
            proxy_pass http://app1backend/;
        }
        location /app2 {
            proxy_pass http://app2backend/;
        }

    }
}

events {

}
```

### Layer 4 (tcp) Proxy

- `nginx.conf` v8

```
stream {
    upstream allbackend {
        server 127.0.0.1:2222;
        server 127.0.0.1:3333;
        server 127.0.0.1:4444;
        server 127.0.0.1:5555;
    }

    server {
        listen 80;
        location / {
            proxy_pass http://allbackend/;
        }
    }
}

events {

}
```

- if you hit `[localhost](http://localhost)` in browser (http), the response is the **same**, because **tcp** connection is not changed, so the http request awalys get the same response.
- but if you use `telnet` (tcp operation) , each time you build another **tcp** connection, the response will be different (Round-Robin Algorithm)

```bash
# build tcp connection to 127.0.0.1:80
telnet 127.0.0.1 80

# Trying 127.0.0.1...
# Connected to localhost.
# Escape character is '^]'.

# Then you type GET / to lannch a http request
GET /

# HTTP/1.1 200 OK
# X-Powered-By: Express
# Content-Type: text/html; charset=utf-8
# Content-Length: 4
# ETag: W/"4-/qf2V/VqKkSNp9S1Ne5eJ5yvPZo"
# Date: Tue, 19 Jan 2021 22:44:47 GMT
# Connection: close
# 2222Connection closed by foreign host.

# build another tcp connection
telnet 127.0.0.1 80

# Trying 127.0.0.1...
# Connected to localhost.
# Escape character is '^]'.

# Then you type GET / to lannch a http request
GET /

# HTTP/1.1 200 OK
# X-Powered-By: Express
# Content-Type: text/html; charset=utf-8
# Content-Length: 4
# ETag: W/"4-/qf2V/VqKkSNp9S1Ne5eJ5yvPZo"
# Date: Tue, 19 Jan 2021 22:44:47 GMT
# Connection: close
# 3333Connection closed by foreign host.
```

### References

- [Nginx Crash Course](https://www.youtube.com/watch?v=WC2-hNNBWII)
