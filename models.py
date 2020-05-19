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

# parses config data from csv file
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
            'smoothing': str(row['smoothing']),
            'lambda': float(row['lambda']),
            'gamma': float(row['gamma']),
            'rho': float(row['rho']),
            'constantH': int(row['constantH']),
            'updateRate': int(row['updateRate']),
            'xMin': int(row['xMin']),
            'xMax': int(row['xMax']),
            'yMin': int(row['yMin']),
            'yMax': int(row['yMax']),
            'bandwidth': float(row['bandwidth']),
            'sample_size': int(row['sample_size']),
            'constantE': float(row['constantE']),
            'trembling': float(row['trembling']),
        })
    return rounds

# the various config fields are spread out between subsession, group, and player
# there isn't actually any difference between putting something in a particular
# class over another, and the reasoning for putting them where they are is lost
# to time
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
        ppg = parse_config(self.session.config['config_file'])[
            self.round_number-1]['players_per_group']
        for i in range(0, len(players), ppg):
            group_matrix.append(players[i:i+ppg])
        self.set_group_matrix(group_matrix)

    # returns the average strategy for the whole session
    def get_average_strategy(self):
        players = self.get_players()
        sum_strategies = 0
        for p in players:
            sum_strategies += p.get_average_strategy()
        return sum_strategies / len(players)

    # returns the average payoff for the whole session
    def get_average_payoff(self):
        players = self.get_players()
        sum_payoffs = 0
        for p in players:
            if not p.payoff:
                p.set_payoff()
            sum_payoffs += p.ave_payoff
        return sum_payoffs / len(players)

    def enable_payoff_landscape(self):
        return parse_config(self.session.config['config_file'])[self.round_number-1]['enable_payoff_landscape']

    def others_bubbles(self):
        return parse_config(self.session.config['config_file'])[self.round_number-1]['others_bubbles']

    def smoothing(self):
        return parse_config(self.session.config['config_file'])[self.round_number-1]['smoothing']

    def players_per_group(self):
        return parse_config(self.session.config['config_file'])[self.round_number-1]['players_per_group']

    def sample_size(self):
        return parse_config(self.session.config['config_file'])[self.round_number-1]['sample_size']

    def constantE(self):
        return parse_config(self.session.config['config_file'])[self.round_number-1]['constantE']

    def trembling(self):
        return parse_config(self.session.config['config_file'])[self.round_number-1]['trembling']


class Group(DecisionGroup):

    def num_rounds(self):
        return len(parse_config(self.session.config['config_file']))

    def period_length(self):
        return parse_config(self.session.config['config_file'])[self.round_number-1]['period_length']

    # lambda is a reserved word
    def constantLambda(self):
        return parse_config(self.session.config['config_file'])[self.round_number-1]['lambda']

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

    def bandwidth(self):
        return parse_config(self.session.config['config_file'])[self.round_number-1]['bandwidth']


class Player(BasePlayer):
    init_decision = FloatField(null=True)
    ave_payoff = FloatField(null=True)

    # sets initial decision to a random value within the x-axis bounds
    def initial_decision(self):
        if not self.init_decision:
            xMax = parse_config(self.session.config['config_file'])[self.round_number-1]['xMax']
            xMin = parse_config(self.session.config['config_file'])[self.round_number-1]['xMin']
            self.init_decision = random.random() * (xMax - xMin) + xMin
            self.save()
        return self.init_decision

    # gets the average strategy for this player
    def get_average_strategy(self):
        decisions = list(Event.objects.filter(
            channel='group_decisions',
            content_type=ContentType.objects.get_for_model(self.group),
            group_pk=self.group.pk).order_by("timestamp"))
        try:
            period_end = Event.objects.get(
                channel='state',
                content_type=ContentType.objects.get_for_model(self.group),
                group_pk=self.group.pk,
                value='period_end').timestamp
        except Event.DoesNotExist:
            return float('nan')
        # sum of all decisions weighted by the amount of time that decision was held
        weighted_sum_decision = 0
        while decisions:
            cur_decision = decisions.pop(0)
            next_change_time = decisions[0].timestamp if decisions else period_end
            decision_value = cur_decision.value[self.participant.code]
            weighted_sum_decision += decision_value * \
                (next_change_time - cur_decision.timestamp).total_seconds()
        return weighted_sum_decision / self.group.period_length()

    # if a player does not have an average payoff yet, fetch it
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

        self.ave_payoff = self.get_payoff(
            period_start, period_end, decisions, numPlayers, constantLambda, gamma, rho)
        self.save()

    # gets average payoff for this player
    def get_payoff(self, period_start, period_end, decisions, numPlayers, constantLambda, gamma, rho):
        period_duration = period_end.timestamp - period_start.timestamp
        payoff = 0
        myDecision = self.initial_decision()
        playerDecisions = {}

        for p in self.group.get_players():
            playerDecisions[p.participant.code] = p.initial_decision()

        for i, d in enumerate(decisions):
            if d.participant == self.participant:
                myDecision = d.value
            playerDecisions[d.participant.code] = d.value
            pos = 1
            tie = 0
            for val in playerDecisions:
                if myDecision > playerDecisions[val]:
                    pos += 1
                if myDecision == playerDecisions[val]:
                    tie += 1
            if tie > 1:
                ux = 1 + (2 * constantLambda * myDecision) - (myDecision * myDecision)
                vy = 0
                for j in range(tie):
                    vy += ((1 - ((pos - 0.5 + j)/numPlayers)/gamma)
                           * (1 + ((pos - 0.5 + j)/numPlayers)/rho))
                vy = vy/tie
                flow_payoff = ux * vy
            else:
                ux = 1 + (2 * constantLambda * myDecision) - (myDecision * myDecision)
                vy = (1 - ((pos - 0.5)/numPlayers)/gamma) * (1 + ((pos - 0.5)/numPlayers)/rho)
                flow_payoff = ux * vy - self.group.yMin()

            if i + 1 < len(decisions):
                next_change_time = decisions[i + 1].timestamp
            else:
                next_change_time = period_end.timestamp
            payoff += (next_change_time - d.timestamp).total_seconds() * flow_payoff

        self.payoff += payoff
        return payoff / period_duration.total_seconds()
