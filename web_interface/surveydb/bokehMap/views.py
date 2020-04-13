from django.shortcuts import render
from django.http import HttpResponse
from django.views.generic import TemplateView

from bokeh.embed import components
from bokeh.models import HoverTool
from bokeh.plotting import figure

from rest_framework_gis.serializers import (
    GeoFeatureModelSerializer
)
from .models import Survey, Location, Time
from rest_framework.viewsets import ReadOnlyModelViewSet
from rest_framework_gis.filters import InBBoxFilter

from django.core.serializers import serialize


# Create your views here.

class SvSerializer( GeoFeatureModelSerializer ):
    class Meta:
        model = Location
        geo_field = 'location'
        fields = ('SurveyID')


class SvViewSet( ReadOnlyModelViewSet ):
    """    bbox_filter_field = 'location'
    filter_backends = (InBBoxFilter)"""
    queryset = Location.objects.filter( location__isnull=False )
    serializer_class = SvSerializer


class HomepageVIew( TemplateView ):
    template_name = 'index.html'


def dataset(request):
    survey = serialize( 'geojson', Location.objects.all(), fields=('SurveyID', 'location'), indent=2,
                        use_natural_foreign_keys=True, use_natural_primary_keys=False )
    return HttpResponse( survey, content_type='json' )
