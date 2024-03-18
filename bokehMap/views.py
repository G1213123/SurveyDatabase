import json

from django.shortcuts import render
from django.http import HttpResponse, JsonResponse
from django.utils.html import escapejs
from django.utils.safestring import mark_safe
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
from django.contrib.gis.geos import Polygon

from django.core.serializers import serialize
import datetime
from functools import reduce
from django.db.models import Q
from django import forms

from django.contrib.auth import login, authenticate
from django.contrib.auth.forms import UserCreationForm
from django.shortcuts import render, redirect
from django.views.generic.list import ListView

import django_filters

from .models import Survey

# Create your views here.

class QueryForm( forms.Form ):
    publish_date_before = forms.DateField(
        label='',
        required=False,
        # initial = datetime.datetime.now(),
        widget=forms.TextInput(
            attrs={
                'class': 'form-control',
                'id': 'datepicker1',
                'placeholder': 'published before'
            } ) )

    publish_date_after = forms.DateField(
        label='',
        required=False,
        # initial = datetime.datetime.now(),
        widget=forms.TextInput(
            attrs={
                'class': 'form-control',
                'id': 'datepicker2',
                'placeholder': 'published after'
            } ) )

    keywords = forms.CharField(
        required=False,
        label='',
        widget=forms.TextInput(

            attrs={
                'class': 'form-control',
                'placeholder': 'space-separated words matching title, synopsis, website or tags'
            } ) )
    
class PlayerProfileFilter(django_filters.FilterSet):
    position = django_filters.CharFilter(method="my_custom_filter")

    def my_custom_filter(self, queryset, name, value):
        query = Q()
        for position in value.split(","):
            query |= Q(position__contains=position)
        return queryset.filter(query)
    
    class Meta:
        model = Location
        fields = ['SurveyID__Survey']


def filter_books(paramDict):
    locations = Location.objects.all()
    # data filtering
    if any( x != '' for x in paramDict.values() ):
        if paramDict['bbox'] != '':
            vertex = get_all_values(json.loads(paramDict['bbox']))
            geom  = Polygon.from_bbox(vertex)
            locations = Location.objects.filter(location__within=geom)
        if paramDict['type'] != '':
            # Create an instance of your custom filter class
            #filter_set = PlayerProfileFilter(paramDict, 'type', queryset=locations)
            #locations = filter_set.qs
            locations = locations.filter(Q(SurveyID__Survey__contains = paramDict['type']))  
        if paramDict['input-number-min'] != '':
            after_date = paramDict['input-number-min']
            _after_date = datetime.date(int(after_date), 1, 1)
            locations = locations.filter( SurveyID__IssueDate__gte=_after_date )

        if paramDict['input-number-max'] != '':
            before_date  = paramDict['input-number-max']
            _before_date  = datetime.date(int(before_date), 12, 31)
            locations = locations.filter( SurveyID__IssueDate__lte=_before_date  )

        # filters records that contain any of the following keywords
        if paramDict['keywords'] != '':
            kws = paramDict['keywords'].split()
            q_lookups = [Q( SurveyID__JobNumber__icontains=kw ) for kw in kws] + \
                        [Q( SurveyID__Survey__icontains=kw ) for kw in kws] + \
                        [Q( SurveyID__Project__icontains=kw ) for kw in kws]
            filters = Q()
            filters |= reduce( lambda x, y: x | y, q_lookups )
            locations = locations.filter( filters )

    return locations


def MapView(request):
    locations = Location.objects.all()

    # if this is a POST request we need to process the form data
    if request.method == 'POST':
        # create a form instance and populate it with data from the request:
        form = QueryForm(request.POST)
        # check whether it's valid:
        if form.is_valid():
            # process the data in form.cleaned_data as required
            # ...
            # redirect to a new URL:
            form = QueryForm( request.POST )
            paramDict = request.GET
            locations = filter_books( paramDict )
            survey = serialize( 'geojson', locations, fields=('SurveyID', 'Survey', 'location'), indent=2,
                                use_natural_foreign_keys=True, use_natural_primary_keys=False )
            context = {
                'survey': mark_safe( escapejs( json.dumps( survey ) ) ),
                'form': form}
            return render(request, 'index2.html', context)

    # if a GET (or any other method) we'll create a blank form
    else:
        form = QueryForm( request.POST )
        paramDict = request.GET
        locations = filter_books(paramDict)
        survey = serialize( 'geojson', locations, fields=('SurveyID', 'Survey', 'location'), indent=2,
                            use_natural_foreign_keys=True, use_natural_primary_keys=False )
        context = {
            'survey':mark_safe(escapejs(json.dumps(survey))),
            'form':form}
        return render(request, 'index2.html', context)
    
def MapQueryJson(request):
    paramDict = request.POST
    if len(paramDict):
        locations = filter_books(paramDict)
    else:
        survey = serialize( 'geojson', locations, fields=('SurveyID', 'Survey', 'location'), indent=2,
                            use_natural_foreign_keys=True, use_natural_primary_keys=False )
    return JsonResponse(survey)

class HomepageVIew( TemplateView ):
    template_name = 'index.html'


def datasetJson(request):
    paramDict = request.POST
    if len(paramDict):
        locations = filter_books(paramDict)
    else:
        locations = Location.objects.all()
    return HttpResponse( data_get(locations), content_type='json' )

def data_get(locations=Location):
    survey = serialize( 'geojson', locations, fields=('SurveyID', 'location'), indent=2,
                        use_natural_foreign_keys=True, use_natural_primary_keys=False )
    return survey



class SurveyListView(ListView):

    model = Survey
    paginate_by = 100  # if pagination is desired
    template_name = 'surveys.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        return context

def get_all_values(data):
    values = []
    for value in data.values():
        if isinstance(value, dict):
            values.extend(get_all_values(value))
        elif isinstance(value, list):
            for item in value:
                if isinstance(item, dict):
                    values.extend(get_all_values(item))
                else:
                    values.append(item)
        else:
            values.append(value)
    return values