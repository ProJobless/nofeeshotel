NameVirtualHost 95.142.170.14:80

<VirtualHost 95.142.170.14:80>
        ServerName      www.alberguesdajuventude.com
        ServerAlias     www.alberguesdajuventude.com
        ServerAlias     alberguesdajuventude.com
        ServerAdmin     technical@mcwebmanagement.com

        DocumentRoot "/srv/d_mcweb9/www/ajroot/htdocs"
    <Directory "/srv/d_mcweb9/www/ajroot/htdocs">
        Options Indexes FollowSymLinks MultiViews
        AllowOverride All
        Order allow,deny
        Allow from all
    </Directory>

    ScriptAlias /cgi-bin/ /srv/d_mcweb9/www/ajroot/cgi-bin/
    <Directory "/srv/d_mcweb9/www/ajroot/cgi-bin/">
        AllowOverride None
        Options +ExecCGI -MultiViews +SymLinksIfOwnerMatch
        Order allow,deny
        Allow from all
    </Directory>

    ErrorLog /srv/d_mcweb9/www/ajroot/logs/www.alberguesdajuventude.com-error.log
    LogLevel warn

    SetEnvIf Remote_Addr "127\.0\.0\.1" loopback
    CustomLog /srv/d_mcweb9/www/ajroot/logs/www.alberguesdajuventude.com-access.log combined env=!loopback
    ServerSignature On

    <IfModule mod_dav.c>
        DAVLockDB /srv/d_mcweb9/www/ajroot/db/DAVLock
    </IfModule>

    <IfModule mpm_peruser_module>
        ServerEnvironment adminftp_www-adminftp
        MaxProcessors 40
    </IfModule>
    

</VirtualHost>

NameVirtualHost 95.142.170.14:443

<VirtualHost 95.142.170.14:443>

        ServerName      www.alberguesdajuventude.com
        ServerAlias     www.alberguesdajuventude.com
        ServerAlias     alberguesdajuventude.com
        ServerAdmin     technical@mcwebmanagement.com

        DocumentRoot "/srv/d_mcweb9/www/ajroot/htdocs"
    <Directory "/srv/d_mcweb9/www/ajroot/htdocs">
        Options Indexes FollowSymLinks MultiViews
        AllowOverride All
        Order allow,deny
        Allow from all
    </Directory>

    ScriptAlias /cgi-bin/ /srv/d_mcweb9/www/ajroot/cgi-bin/
    <Directory "/srv/d_mcweb9/www/ajroot/cgi-bin/">
        AllowOverride None
        Options +ExecCGI -MultiViews +SymLinksIfOwnerMatch
        Order allow,deny
        Allow from all
    </Directory>

    ErrorLog /srv/d_mcweb9/www/ajroot/logs/www.alberguesdajuventude.com-error.log
    LogLevel warn

    SetEnvIf Remote_Addr "127\.0\.0\.1" loopback
    CustomLog /srv/d_mcweb9/www/ajroot/logs/www.alberguesdajuventude.com-access.log combined env=!loopback
    ServerSignature On

    <IfModule mod_dav.c>
        DAVLockDB /srv/d_mcweb9/www/ajroot/db/DAVLock
    </IfModule>

    <IfModule mpm_peruser_module>
        ServerEnvironment adminftp_www-adminftp
        MaxProcessors 40
    </IfModule>

    
    SSLEngine on

    SSLCertificateFile      /etc/apache2/ssl-cert/alberguesdajuventude.crt
    SSLCACertificateFile    /etc/apache2/ssl-cert/alberguesdajuventude.pem
    SSLCertificateKeyFile   /etc/apache2/ssl-cert/alberguesdajuventude.key

</VirtualHost>

