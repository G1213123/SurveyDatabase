from django.contrib import admin
from django.http import HttpResponseRedirect
# Register your models here.

from django.contrib.gis.geos import Point
from leaflet.forms.widgets import LeafletWidget
from mapwidgets.widgets import GooglePointFieldWidget
from .models import Survey, Time, Location
from django.contrib.gis.db import models
from django.contrib.gis import forms
from . import SelectTimeWidget
from django.forms import Textarea


@admin.register( Survey )
class SurveyAdmin( admin.ModelAdmin ):
    list_display = [x.name for x in Survey._meta.fields]
    ordering = ('SurveyID',)
    formfield_overrides = {
        models.TextField: {'widget': Textarea(
            attrs={'rows': 1,
                   'cols': 40,
                   'style': 'height: 8em;'} )},
    }

    # redirect(r'/admin/bokehMap/survey/add/')
    def response_add(self, request, obj, post_url_continue="../%s/"):
        if '_continue' in request.POST:
            return HttpResponseRedirect( f'/admin/bokehMap/time/add?SurveyID={obj.pk}' )
        else:
            return HttpResponseRedirect( '/admin/bokehMap/survey/add' )


LEAFLET_WIDGET_ATTRS = {
    'map_height': '500px',
    'map_width': '100%',
}

LEAFLET_FIELD_OPTIONS = {'widget': LeafletWidget( attrs=LEAFLET_WIDGET_ATTRS )}

FORMFIELD_OVERRIDES = {
    models.PointField: LEAFLET_FIELD_OPTIONS,
    models.MultiPointField: LEAFLET_FIELD_OPTIONS,
    models.LineStringField: LEAFLET_FIELD_OPTIONS,
    models.MultiLineStringField: LEAFLET_FIELD_OPTIONS,
    models.PolygonField: LEAFLET_FIELD_OPTIONS,
    models.MultiPolygonField: LEAFLET_FIELD_OPTIONS,
}


class FixedGooglePointFieldWidget( GooglePointFieldWidget ):
    def render(self, name, value, attrs=None, renderer=None):
        if isinstance( value, Point ):
            x = value.x
            value.x = value.y
            value.y = x
        return super( FixedGooglePointFieldWidget, self ).render( name, value, attrs, renderer )


from mapwidgets.settings import mw_settings


def minify_if_not_debug(asset):
    """
        Transform template string `asset` by inserting '.min' if DEBUG=False
    """
    return asset.format( "" if not mw_settings.MINIFED else ".min" )


class FixedGoogleMultiPointFieldWidget( GooglePointFieldWidget ):

    @property
    def media(self):
        css = {
            "all": [
                minify_if_not_debug( "mapwidgets/css/map_widgets{}.css" ),
            ]
        }

        js = [
            "https://maps.googleapis.com/maps/api/js?libraries=places&language={}&key={}".format(
                mw_settings.LANGUAGE, mw_settings.GOOGLE_MAP_API_KEY
            )
        ]

        if not mw_settings.MINIFED:  # pragma: no cover
            js = js + [
                "mapwidgets/js/jquery_init.js",
                "mapwidgets/js/jquery_class.js",
                "mapwidgets/js/django_mw_base.js",
                "js/mw_google_multipoint_field.js",
            ]
        else:
            js = js + [
                "mapwidgets/js/mw_google_point_field.min.js"
            ]

        return forms.Media( js=js, css=css )

    def render(self, name, value, attrs=None, renderer=None):
        if isinstance( value, Point ):
            x = value.x
            value.x = value.y
            value.y = x
        return super( FixedGoogleMultiPointFieldWidget, self ).render( name, value, attrs, renderer )


@admin.register( Location )
class LocationAdmin( admin.ModelAdmin ):
    list_display = ('SurveyID', 'Survey', 'location')
    readonly_fields = ('location',)
    formfield_overrides = {
        models.PointField: {"widget": FixedGooglePointFieldWidget(attrs=LEAFLET_WIDGET_ATTRS)},
        models.MultiPointField: {"widget": FixedGoogleMultiPointFieldWidget}
    }

    def save_model(self, request, obj, form, change):
        if obj.location is not None:
            x = obj.location.y
            obj.location.y = obj.location.x
            obj.location.x = x
        elif obj.locations is not None:
            pass
        super( LocationAdmin, self ).save_model( request, obj, form, change )

    def get_readonly_fields(self, request, obj=None):
        if obj:  # editing an existing object
            return ('locations',)
        return self.readonly_fields

    def response_add(self, request, obj, post_url_continue="../%s/"):
        if '_addanother' in request.POST:
            return HttpResponseRedirect( f'/admin/bokehMap/location/add?SurveyID={obj.SurveyID}' )
        else:
            return HttpResponseRedirect( '/admin/bokehMap/location' )


@admin.register( Time )
class TimeAdmin( admin.ModelAdmin ):
    list_display = ('SurveyID', 'TStart', 'TEnd', 'TEnd')
    formfield_overrides = {
        models.TimeField: {'widget': SelectTimeWidget.SelectTimeWidget( minute_step=10, use_seconds=False )}, }

    def response_add(self, request, obj, post_url_continue="../%s/"):
        if '_continue' in request.POST:
            return HttpResponseRedirect( f'/admin/bokehMap/location/add?SurveyID={obj.SurveyID}' )
        elif '_addanother' in request.POST:
            return HttpResponseRedirect( f'/admin/bokehMap/time/add?SurveyID={obj.SurveyID}' )
        else:
            return HttpResponseRedirect( '/admin/bokehMap/location' )
