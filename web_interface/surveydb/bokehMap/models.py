from django.db import models
from django.shortcuts import redirect
# Create your models here.

from django.contrib.gis.db import models
from multiselectfield import MultiSelectField
from django.contrib.gis.geos import Point, MultiPoint


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
        return (self.SurveyID,  self.JobNumber, self.Project, self.Survey, self.IssueDate)

    def __str__(self):
        return self.SurveyID


class TTag_choices( models.TextChoices ):
    am = '1', "am"
    pm = '2', "pm"
    noon = '3', "noon"
    night = '4', "night"
    all_day = '5', "24hr"
    others = '6', "others"


class Time( models.Model ):
    SurveyID = models.ForeignKey( Survey, on_delete=models.CASCADE )
    TStart = models.TimeField()
    TEnd = models.TimeField()
    TTag = models.CharField( max_length=10, choices=TTag_choices.choices )


class Location( models.Model ):
    SurveyID = models.ForeignKey( Survey, on_delete=models.CASCADE )
    location = models.MultiPointField( srid=4326)
    Survey = MultiSelectField(choices=SURVEY_CHOICES, default='', blank=True, null=True)

    def save(self, *args, **kwargs):
        feature = self.location
        list=[]
        for pt in feature:
            list.append(Location(SurveyID=self.SurveyID, location=MultiPoint([pt])))

        Location.objects.bulk_create(list)

