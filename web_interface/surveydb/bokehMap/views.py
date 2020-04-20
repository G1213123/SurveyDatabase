import json

from django.shortcuts import render
from django.http import HttpResponse
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

from django.core.serializers import serialize
import datetime
from functools import reduce
from django.db.models import Q
from django import forms

from django.contrib.auth import login, authenticate
from django.contrib.auth.forms import UserCreationForm
from django.shortcuts import render, redirect

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

def filter_books(Location, paramDict):
    # paramDict = request.GET
    params = paramDict.keys()

    # data filtering
    if any( x != '' for x in paramDict.values() ):
        if paramDict['input-number-min'] != '':
            after_date = paramDict['input-number-min']
            _after_date = datetime.date(after_date, 1, 1)
            Location = Location.filter( SurveyID__IssueDate__gte=_after_date )

        if paramDict['input-number-max'] != '':
            before_date  = paramDict['input-number-max']
            _before_date  = datetime.date(before_date, 12, 31)
            Location = Location.filter( SurveyID__IssueDate__lte=_before_date  )

        # filters records that contain any of the following keywords
        if paramDict['keywords'] != '':
            kws = paramDict['keywords'].split()
            q_lookups = [Q( SurveyID__JobNumber__icontains=kw ) for kw in kws] + \
                        [Q( SurveyID__Survey__icontains=kw ) for kw in kws] + \
                        [Q( SurveyID__Project__icontains=kw ) for kw in kws]
            filters = Q()
            filters |= reduce( lambda x, y: x | y, q_lookups )
            Location = Location.filter( filters )

    return Location

def MapView(request):
    locations = Location.objects.all()


    form = QueryForm(request.GET or None)
    paramDict = request.GET
    locations = filter_books(locations, paramDict)
    survey = serialize( 'geojson', locations, fields=('SurveyID', 'Survey', 'location'), indent=2,
                        use_natural_foreign_keys=True, use_natural_primary_keys=False )
    context = {
        'survey':mark_safe(escapejs(json.dumps(survey))),
        'form':form}
    return render(request, 'index2.html', context)

class HomepageVIew( TemplateView ):
    template_name = 'index.html'


def dataset(request):
    survey = data_get()
    return HttpResponse( survey, content_type='json' )

def data_get(locations=Location):
    survey = serialize( 'geojson', Location.objects.all(), fields=('SurveyID', 'location'), indent=2,
                        use_natural_foreign_keys=True, use_natural_primary_keys=False )
    return survey