from django.db import models
from django.shortcuts import redirect
# Create your models here.

from django.contrib.gis.db import models
from multiselectfield import MultiSelectField
from django.contrib.gis.geos import Point, MultiPoint
from time import strftime

SURVEY_CHOICES = (("Vehicular", 'Vehicular Count'),
                  ("Pedestrian", 'Pedestrian Count'),
                  ("Public Transport", 'Public Transport Count'),
                  ("Parking", 'Parking Survey'),
                  ("Illegal Parking", 'Illegal Parking Survey'),
                  ("Queue Length", 'Queue Length'),
                  ("Interview", 'Interview')
                  )


class SurveyManager( models.Manager ):
    def get_by_natural_key(self, SurveyID, JobNumber, Project, Survey, IssueDate):
        return self.get( SurveyID= SurveyID, JobNumber=JobNumber, Project=Project , Survey=Survey, IssueDate=IssueDate)

class Survey( models.Model ):
    SurveyID = models.CharField( max_length=10, unique=True, blank=False, primary_key=True )
    JobNumber = models.CharField( max_length=10, default=None, blank=True, null=True  )
    Project = models.TextField( max_length=500, default=None, blank=True, null=True  )
    Survey = MultiSelectField( choices=SURVEY_CHOICES, default=None, blank=True, null=True  )
    Author = models.CharField( max_length=20, default=None, blank=True, null=True  )
    IssueDate = models.DateField(default=None, blank=True, null=True )
    Amount = models.DecimalField( max_digits=10, decimal_places=2, default=None, blank=True, null=True  )
    PaymentStatus = models.DateField( default=None, blank=True, null=True )
    Remark = models.CharField( max_length=500, default=None, blank=True, null=True )

    objects = SurveyManager()

    def natural_key(self):
        return {'SurveyID':self.SurveyID,  'JobNumber':self.JobNumber, 'Project':self.Project, 'Survey':self.Survey, 'IssueDate':self.IssueDate, 'Times':self.get_times()}

    def __str__(self):
        return self.SurveyID

    def get_times(self):
        list = []
        for obj in self.times.all():
            list.append(str(obj))
        return str(list)


TTag_choices = (
    ( '1', "am"),
    ( '2', "pm"),
    ('3', "noon"),
    ('4', "night"),
    ('5', "24hr"),
    ('6', "others"))

TTag_name = {key: value for key, value in TTag_choices}

class Time( models.Model ):
    SurveyID = models.ForeignKey( Survey, on_delete=models.CASCADE, related_name='times' )
    TStart = models.TimeField()
    TEnd = models.TimeField()
    TTag = models.CharField( max_length=10, choices=TTag_choices )

    def natural_key(self):
        return {'TStart':self.TStart.strftime("%H:%M"),  'TEnd':self.TEnd.strftime("%H:%M"), 'TTag':self.TTag}

    def __str__(self):
        return f'{self.TStart.strftime("%H:%M")} - {self.TEnd.strftime("%H:%M")} ({TTag_name[self.TTag]})'

class Location( models.Model ):
    SurveyID = models.ForeignKey( Survey, on_delete=models.CASCADE )
    location = models.PointField( srid=4326 )
    locations = models.MultiPointField( srid=4326, blank=True, null=True  )
    Survey = MultiSelectField( choices=SURVEY_CHOICES, default='', blank=True, null=True )


    def save(self, *args, **kwargs):
        feature = self.locations
        list = []
        if self.locations is None and self.location is not None:
            super(Location,self).save(*args,**kwargs)
        elif self.locations is not None and self.location is not None:
            for pt in feature:
                list.append( Location( SurveyID=self.SurveyID, location=pt, Survey=self.Survey) )

            Location.objects.bulk_create( list )
            super(Location,self).delete()
        else:
            for pt in feature:
                list.append( Location( SurveyID=self.SurveyID, location=pt, Survey=self.Survey) )

            Location.objects.bulk_create( list )

