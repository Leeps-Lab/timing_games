import csv
import random

from django.contrib.contenttypes.models import ContentType
from django.db.models import FloatField
from otree.constants import BaseConstants
from otree.models import BasePlayer, BaseSubsession

from otree_redwood.models import Event, DecisionGroup

doc = """
This is a configurable timing game.
"""

class Constants(BaseConstants):
    name_in_url = 'timing_games'
    players_per_group = None
	# Maximum number of rounds, actual number is taken as the max round
	# in the config file.
    num_rounds = 100
    base_points = 0


def parse_config(config_file):
    with open('timing_games/configs/' + config_file) as f:
        rows = list(csv.DictReader(f))

    rounds = []
    for row in rows:
        rounds.append({
            'period_length': int(row['period_length']),
            'players_per_group': int(row['players_per_group']),
            'enable_payoff_landscape': True if row['enablePayoffLandscape'] == 'TRUE' else False,
            'others_bubbles': str(row['others_bubbles']),
            'constantLambda': int(row['lambda']),
            'gamma': float(row['gamma']),
            'rho': float(row['rho']),
            'constantH': int(row['constantH']),
            'updateRate': int(row['updateRate']),
            'xMin': int(row['xMin']),
            'xMax': int(row['xMax']),
            'yMin': int(row['yMin']),
            'yMax': int(row['yMax']),
            'displayLower': float(row['displayLower']),
            'displayUpper': float(row['displayUpper']),
        })
    return rounds

class Subsession(BaseSubsession):

    def before_session_starts(self):
        config = parse_config(self.session.config['config_file'])
        if self.round_number > len(config):
            return

    def creating_session(self):
        config = parse_config(self.session.config['config_file'])
        if self.round_number > len(config):
            return
        group_matrix = []
        players = self.get_players()
        ppg = parse_config(self.session.config['config_file'])[self.round_number-1]['players_per_group']
        for i in range(0, len(players), ppg):
            group_matrix.append(players[i:i+ppg])
        self.set_group_matrix(group_matrix)

    def enable_payoff_landscape(self):
        return parse_config(self.session.config['config_file'])[self.round_number-1]['enable_payoff_landscape']

    def others_bubbles(self):
        return parse_config(self.session.config['config_file'])[self.round_number-1]['others_bubbles']

    def players_per_group(self):
        return parse_config(self.session.config['config_file'])[self.round_number-1]['players_per_group']


class Group(DecisionGroup):

    def num_rounds(self):
        return len(parse_config(self.session.config['config_file']))

    def period_length(self):
        return parse_config(self.session.config['config_file'])[self.round_number-1]['period_length']

    def constantLambda(self):
        return parse_config(self.session.config['config_file'])[self.round_number-1]['constantLambda']

    def gamma(self):
        return parse_config(self.session.config['config_file'])[self.round_number-1]['gamma']

    def rho(self):
        return parse_config(self.session.config['config_file'])[self.round_number-1]['rho']

    def constantH(self):
        return parse_config(self.session.config['config_file'])[self.round_number-1]['constantH']

    def updateRate(self):
        return parse_config(self.session.config['config_file'])[self.round_number-1]['updateRate']

    def xMin(self):
        return parse_config(self.session.config['config_file'])[self.round_number-1]['xMin']

    def xMax(self):
        return parse_config(self.session.config['config_file'])[self.round_number-1]['xMax']

    def yMin(self):
        return parse_config(self.session.config['config_file'])[self.round_number-1]['yMin']

    def yMax(self):
        return parse_config(self.session.config['config_file'])[self.round_number-1]['yMax']

    def displayLower(self):
        return parse_config(self.session.config['config_file'])[self.round_number-1]['displayLower']

    def displayUpper(self):
        return parse_config(self.session.config['config_file'])[self.round_number-1]['displayUpper']

    def maxPayoff(self):
        sliderMax = 1 + 2 * self.constantLambda()
        numPlayers = len(self.get_players())
        ux = 1 + (2 * self.constantLambda() * (sliderMax)/2) - ((sliderMax/2) ** 2)
        uy = (1 - (((numPlayers/2 - 0.5)/numPlayers)/self.gamma())) * (1 + ((numPlayers/2 - 0.5)/numPlayers)/self.rho())
        return ux * uy

    def minPayoff(self):
        numPlayers = len(self.get_players())
        uxLeft = 1 + (2 * self.constantLambda() * self.xMin()) - (self.xMin() ** 2)
        uxRight = 1 + (2 * self.constantLambda() * self.xMax()) - (self.xMax() ** 2)
        uyLeft = (1 - ((0.5/numPlayers)/self.gamma()) * (1 + ((0.5/numPlayers)/self.rho())))
        uyRight = (1 - (((numPlayers - 0.5)/numPlayers)/self.gamma())) * (1 + ((numPlayers - 0.5)/numPlayers)/self.rho())
        left = uxLeft * uyLeft
        right = uxRight * uyRight
        return min(left, right)

class Player(BasePlayer):
    init_decision = FloatField(null=True)

    def initial_decision(self):
        if not self.init_decision:
            xMax = parse_config(self.session.config['config_file'])[self.round_number-1]['xMax']
            xMin = parse_config(self.session.config['config_file'])[self.round_number-1]['xMin']
            self.init_decision = random.random() * (xMax - xMin) + xMin
            self.save()
        return self.init_decision

"""
    def set_payoff(self):
        decisions = list(Event.objects.filter(
                channel='decisions',
                content_type=ContentType.objects.get_for_model(self.group),
                group_pk=self.group.pk).order_by("timestamp"))

        try:
            period_start = Event.objects.get(
                    channel='state',
                    content_type=ContentType.objects.get_for_model(self.group),
                    group_pk=self.group.pk,
                    value='period_start')
            period_end = Event.objects.get(
                    channel='state',
                    content_type=ContentType.objects.get_for_model(self.group),
                    group_pk=self.group.pk,
                    value='period_end')
        except Event.DoesNotExist:
            return float('nan')

        constantLambda = self.group.constantLambda()
        gamma = self.group.gamma()
        rho = self.group.rho()
        numPlayers = len(self.group.get_players())

        self.payoff = self.get_payoff(period_start, period_end, decisions, numPlayers, constantLambda, gamma, rho)


    def get_payoff(self, period_start, period_end, decisions, numPlayers, constantLambda, gamma, rho):
        period_duration = period_end.timestamp - period_start.timestamp

        payoff = 0

        Aa = payoff_matrix[0][self.id_in_group-1]
        Ab = payoff_matrix[1][self.id_in_group-1]
        Ba = payoff_matrix[2][self.id_in_group-1]
        Bb = payoff_matrix[3][self.id_in_group-1]

        if self.id_in_group == 1:
            row_player = self.participant
            q1, q2 = self.initial_decision(), self.other_player().initial_decision()
        else:
            row_player = self.other_player().participant
            q2, q1 = self.initial_decision(), self.other_player().initial_decision()

        q1, q2 = 0.5, 0.5
        for i, d in enumerate(decisions):
            if d.participant == row_player:
                q1 = d.value
            else:
                q2 = d.value
            flow_payoff = ((Aa * q1 * q2) +
                           (Ab * q1 * (1 - q2)) +
                           (Ba * (1 - q1) * q2) +
                           (Bb * (1 - q1) * (1 - q2)))

            if i + 1 < len(decisions):
                next_change_time = decisions[i + 1].timestamp
            else:
                next_change_time = period_end.timestamp
            payoff += (next_change_time - d.timestamp).total_seconds() * flow_payoff

        return payoff / period_duration.total_seconds()
"""
