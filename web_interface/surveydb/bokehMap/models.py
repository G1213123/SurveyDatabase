from django.db import models
from django.shortcuts import redirect
# Create your models here.

from django.contrib.gis.db import models
from multiselectfield import MultiSelectField

SURVEY_CHOICES = ((1, 'Vehicular Count'),
                  (2, 'Pedestrian Count'),
                  (3, 'Public Transport Count'),
                  (4, 'Car Park Survey'),
                  (5, 'Illegal Parking Survey'))


class SurveyManager( models.Manager ):
    def get_by_natural_key(self, SurveyID, JobNumber, Project, Survey, IssueDate):
        return self.get( SurveyID= SurveyID, JobNumber=JobNumber, Project=Project , Survey=Survey, IssueDate=IssueDate)

class Survey( models.Model ):
    SurveyID = models.CharField( max_length=10, unique=True, blank=False, primary_key=True )
    JobNumber = models.CharField( max_length=10 )
    Project = models.CharField( max_length=500 )
    Survey = MultiSelectField( choices=SURVEY_CHOICES )
    Author = models.CharField( max_length=20 )
    IssueDate = models.DateField()
    Amount = models.DecimalField( max_digits=10, decimal_places=2 )
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
    location = models.PointField( srid=4326, null=True )
