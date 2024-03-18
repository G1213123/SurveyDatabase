"""surveydb URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/3.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.urls import include, re_path

from rest_framework.routers import DefaultRouter
from .views import  MapView, datasetJson, QueryForm, SurveyListView, datasetJson
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.shortcuts import redirect



urlpatterns = [
    re_path(r'^$', lambda req: redirect('/map/')),
    re_path(r'^map/$', MapView, name='home'),
    re_path(r'^mapQuery/$', datasetJson, name='MayQuery'),
    re_path(r'^data/$', datasetJson, name='data'),
    re_path(r'^form/$', QueryForm, name='form'),
    re_path(r'^surveys/$', SurveyListView.as_view(), name='surveys')
]

urlpatterns += staticfiles_urlpatterns()