from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0002_incident_planningproject_generatedreport'),
    ]

    operations = [
        migrations.CreateModel(
            name='Zone',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=120)),
                ('city', models.CharField(choices=[('Nairobi', 'Nairobi'), ('Mombasa', 'Mombasa'), ('Eldoret', 'Eldoret')], default='Nairobi', max_length=50)),
                ('boundary', models.TextField(blank=True, null=True)),
            ],
        ),
        migrations.AlterModelOptions(
            name='incident',
            options={},
        ),
        migrations.RemoveField(
            model_name='incident',
            name='reported_at',
        ),
        migrations.AddField(
            model_name='incident',
            name='location',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='planningproject',
            name='footprint',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='incident',
            name='latitude',
            field=models.FloatField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='incident',
            name='longitude',
            field=models.FloatField(blank=True, null=True),
        ),
    ]
