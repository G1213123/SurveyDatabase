
from .models import Survey, Location, Time
from django import forms

class FilterMapForm(forms.ModelForm):
    class Meta:
        model = Location

    def __init__(self, *args, **kwargs):
        Project = kwargs.pop( 'Filter', '' )
        IssueDate = kwargs.pop( 'Range', '' )
        super( Survey, self ).__init__( *args, **kwargs )
        self.fields['user_defined_code'] = forms.ModelChoiceField(
            queryset=Location.objects.filter( Project=Project, IssueDate=IssueDate ) )
        self.widgets = {
            'duration': forms.TextInput( attrs={'type': 'range'} )
        }