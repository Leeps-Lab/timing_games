from ._builtin import Page, WaitPage

from datetime import timedelta
from operator import concat
from functools import reduce
from .models import parse_config


class Introduction(Page):

    def is_displayed(self):
        return self.round_number == 1


class DecisionWaitPage(WaitPage):
    body_text = 'Waiting for all players to be ready'

    wait_for_all_groups = True

    def is_displayed(self):
        return self.round_number <= self.group.num_rounds()


class Decision(Page):

    def is_displayed(self):
        return self.round_number <= self.group.num_rounds()


class Results(Page):

    def vars_for_template(self):
        if not self.player.payoff:
            self.player.set_payoff()
        return {
            'player_average_strategy': self.subsession.get_average_strategy(),
            'player_average_payoff': self.subsession.get_average_payoff(),
        }

    def is_displayed(self):
        return self.round_number <= self.group.num_rounds()


def get_config_columns(group):
    config = parse_config(group.session.config['config_file'])[group.round_number - 1]

    return [
        config['period_length'],
        config['players_per_group'],
        config['enable_payoff_landscape'],
        config['others_bubbles'],
        config['lambda'],
        config['gamma'],
        config['rho'],
        config['constantH'],
        config['updateRate'],
        config['xMin'],
        config['xMax'],
        config['yMin'],
        config['yMax'],
        config['bandwidth'],
        config['smoothing'],
        config['sample_size'],
        config['constantE'],
        config['trembling'],
    ]


def get_output_table_header(groups):
    max_num_players = max(len(g.get_players()) for g in groups)

    header = [
        'session_code',
        'subsession_id',
        'id_in_subsession',
        'tick',
    ]

    for player_num in range(1, max_num_players + 1):
        header.append('p{}_code'.format(player_num))
        header.append('p{}_strategy'.format(player_num))

    header += [
        'period_length',
        'players_per_group',
        'enable_payoff_landscape',
        'others_bubbles',
        'lambda',
        'gamma',
        'rho',
        'constantH',
        'updateRate',
        'xMin',
        'xMax',
        'yMin',
        'yMax',
        'bandwidth',
        'smoothing',
        'sample_size',
        'constantE',
        'trembling',
    ]
    return header


def get_output_table(events):
    if not events:
        return []
    return get_output(events)


def get_output(events):
    rows = []
    minT = min(e.timestamp for e in events if e.channel == 'state')
    maxT = max(e.timestamp for e in events if e.channel == 'state')
    group = events[0].group
    players = group.get_players()
    max_num_players = parse_config(group.session.config['config_file'])[
        group.round_number - 1]['players_per_group']
    config_columns = get_config_columns(group)
    # sets sampling frequency
    ticks_per_second = 2
    decisions = {p.participant.code: float('nan') for p in players}
    for tick in range((maxT - minT).seconds * ticks_per_second):
        currT = minT + timedelta(seconds=(tick / ticks_per_second))
        cur_decision_event = None
        while events[0].timestamp <= currT:
            e = events.pop(0)
            if e.channel == 'group_decisions':
                cur_decision_event = e
        if cur_decision_event:
            decisions.update(cur_decision_event.value)
        row = [
            group.session.code,
            group.subsession_id,
            group.id_in_subsession,
            tick,
        ]
        for player_num in range(max_num_players):
            if player_num >= len(players):
                continue
            else:
                pcode = players[player_num].participant.code
                row += [
                    pcode,
                    decisions[pcode],
                ]
        row += config_columns
        rows.append(row)
    return rows


page_sequence = [
    DecisionWaitPage,
    Decision,
    Results
]
