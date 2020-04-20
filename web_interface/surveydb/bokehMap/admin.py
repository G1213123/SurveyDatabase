from django.contrib import admin
from django.http import HttpResponseRedirect
# Register your models here.

from django.contrib.gis.admin import OSMGeoAdmin
from django.shortcuts import redirect
from .models import Survey, Time, Location
from django.contrib.admin.widgets import AdminTimeWidget
from django.db import models
from django.contrib.gis.db import models as gismodels
from django.contrib.gis import forms
from .import SelectTimeWidget
from django.forms import Textarea
import os

@admin.register(Survey)
class SurveyAdmin(OSMGeoAdmin):
    list_display = [x.name for x in Survey._meta.fields]
    ordering = ('SurveyID',)
    formfield_overrides = {
        models.TextField: {'widget': Textarea(
            attrs={'rows': 1,
                   'cols': 40,
                   'style': 'height: 8em;'})},
    }
    #redirect(r'/admin/bokehMap/survey/add/')
    def response_add(self, request, obj, post_url_continue="../%s/"):
        if '_continue' in request.POST:
            return HttpResponseRedirect(f'/admin/bokehMap/time/add?SurveyID={obj.pk}')
        else:
            return('/admin/bokehMap/survey')



@admin.register(Location)
class LocationAdmin(OSMGeoAdmin):
    list_display = ('SurveyID','Survey','location')
    readonly_fields = ('location',)
    default_lat = 2550029
    default_lon = 12709519
    default_zoom = 12
    map_width = 1280
    map_height = 400
    def response_add(self, request, obj, post_url_continue="../%s/"):
        if '_addanother' in request.POST:
            return HttpResponseRedirect(f'/admin/bokehMap/location/add?SurveyID={obj.SurveyID}')
        else:
            return HttpResponseRedirect('/admin/bokehMap/location')


@admin.register(Time)
class LocationAdmin(admin.ModelAdmin):
    list_display = ('SurveyID', 'TStart', 'TEnd', 'TEnd')
    formfield_overrides = {
        models.TimeField: {'widget': SelectTimeWidget.SelectTimeWidget(minute_step=10, use_seconds=False)},}
    def response_add(self, request, obj, post_url_continue="../%s/"):
        if '_continue' in request.POST:
            return HttpResponseRedirect(f'/admin/bokehMap/location/add?SurveyID={obj.SurveyID}')
        elif '_addanother' in request.POST:
            return HttpResponseRedirect(f'/admin/bokehMap/time/add?SurveyID={obj.SurveyID}')
        else:
            return HttpResponseRedirect( '/admin/bokehMap/location' )