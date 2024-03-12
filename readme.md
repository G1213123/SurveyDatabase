# Survey Database
Survey Database hosted in a Django server.

## Prerequisites

Before you can run the project, you need to set up a Google Maps JavaScript API key. Follow these steps to obtain an API key:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/) and create a new project.
2. Enable the Google Maps JavaScript API for your project.
3. Create a new API key for your project.
4. Copy the API key.

Another required dependency is OSGeo4W,
download available at: [OSGeo4W](https://qgis.org/zh-Hant/site/forusers/alldownloads.html#osgeo4w-installer)

## Setting up the Environment

To set up the environment for the project, follow these steps:

1. Create a new file named `.env` in the root directory of the project.
2. Add the following line to the `.env` file, replacing `YOUR_API_KEY` with your Google Maps JavaScript API key:
```GOOGLE_MAP_API_KEY=YOUR_API_KEY```

This will set the `GOOGLE_MAPS_API_KEY` environment variable to your API key.


## Getting Started

To get started with the project, follow these steps:


1. Install the project requirements by running the following command:

```pip install -r requirements.txt```

2. Run the following command to create the database file:

```python manage.py migrate```

This will create a new SQLite database file named db.sqlite3 in your project's root directory.

3. Run the server by running the following command:

```python manage.py runserver```

This will start the development server at `http://localhost:8000/`.

That's it! You should now be able to view the project in your web browser by navigating to `http://localhost:8000/`.

