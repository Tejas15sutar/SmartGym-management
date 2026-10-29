[1mdiff --git a/backend/config/urls.py b/backend/config/urls.py[m
[1mindex cc64391..1520230 100644[m
[1m--- a/backend/config/urls.py[m
[1m+++ b/backend/config/urls.py[m
[36m@@ -1,8 +1,20 @@[m
 [m
 from django.contrib import admin[m
[32m+[m[32mfrom django.http import JsonResponse[m
 from django.urls import include, path[m
 [m
[32m+[m
[32m+[m[32mdef home(request):[m
[32m+[m[32m    return JsonResponse({[m
[32m+[m[32m        "message": "SmartGym Backend is running successfully!",[m
[32m+[m[32m        "status": "online",[m
[32m+[m[32m        "api": "/api/",[m
[32m+[m[32m        "admin": "/admin/",[m
[32m+[m[32m    })[m
[32m+[m
[32m+[m
 urlpatterns = [[m
[32m+[m[32m    path("", home, name="home"),[m
     path("admin/", admin.site.urls),[m
     path("api/auth/", include("accounts.urls")),[m
     path("api/members/", include("members.urls")),[m
