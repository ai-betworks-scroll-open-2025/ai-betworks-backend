import { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '../config';
import { Database, Tables } from '../types/database.types';
import { RoomOperationResult } from '../types/roomTypes';
import { RoundMessageDB as RoundMessage } from '../types/roundTypes';

export class RoundService {
  async storeRoundAgentMessage({
    record,
  }: {
    record: Database['public']['Tables']['round_agent_messages']['Insert'];
  }): Promise<RoomOperationResult<RoundMessage>> {
    try {
      console.log('record on storeRoundAgentMessage', record);

      const { data: storedMessage, error } = await supabase
        .from('round_agent_messages')
        .insert(record)
        .select('*, agents!round_agent_messages_agent_id_fkey(display_name, character_card)') // Specify the foreign key relationship
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: storedMessage };
    } catch (err) {
      console.error('Error storing round message:', err);
      return { success: false, error: 'Failed to store round message' };
    }
  }

  async storeRoundUserMessage({
    record,
  }: {
    record: Database['public']['Tables']['round_user_messages']['Insert'];
  }): Promise<RoomOperationResult<RoundMessage>> {
    try {
      console.log('record on storeRoundUserMessage', record);

      const { data: storedMessage, error } = await supabase
        .from('round_user_messages')
        .insert(record)
        .select('*, users!round_user_messages_user_id_fkey(display_name)') // Specify the foreign key relationship
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: storedMessage };
    } catch (err) {
      console.error('Error storing round message:', err);
      return { success: false, error: 'Failed to store round message' };
    }
  }

  // private async deactivateRoomRounds(roomId: number): Promise<void> {
  //   const { error } = await supabase.from('rounds').update({ active: false }).eq('room_id', roomId);

  //   if (error) throw error;
  // }
  // TODO, this is obsolete, the logic for starting a round is now all in bg-sync.ts
  // private async createNewRound(roomId: number): Promise<RoomOperationResult<RoundData>> {
  //   try {
  //     // Get room configuration
  //     const { roundDuration, gameMasterId, error: configError } = await this.getConfigFromRoom(roomId);
  //     if (configError) {
  //       return { success: false, error: 'Failed to get room config: ' + configError };
  //     }

  //     // Calculate round end time
  //     const roundEndsOn = new Date();
  //     roundEndsOn.setSeconds(roundEndsOn.getSeconds() + roundDuration);

  //     const roundData: Database['public']['Tables']['rounds']['Insert'] = {
  //       room_id: roomId,
  //       active: true,
  //       game_master_id: gameMasterId,
  //       round_config: {
  //         endsOn: roundEndsOn.toISOString(),
  //       },
  //     };

  //     const { data: newRound, error: createError } = await supabase
  //       .from('rounds')
  //       .insert([roundData])
  //       .select()
  //       .single();

  //     if (createError) {
  //       return { success: false, error: createError.message };
  //     }

  //     // await this.addRoomAgentsToRound(roomId, newRound.id);

  //     return { success: true, data: newRound };
  //   } catch (err) {
  //     console.error('Error in createNewRound:', err);
  //     return { success: false, error: 'Failed to create new round' };
  //   }
  // }
  // TODO, this is obsolete, the logic for ending a round is now all in bg-sync.ts
  // async endRound(roundId: number, outcome?: any): Promise<RoomOperationResult<void>> {
  //   try {
  //     const { error } = await supabase
  //       .from('rounds')
  //       .update({
  //         active: false,
  //         outcome: outcome,
  //       })
  //       .eq('id', roundId);

  //     if (error) {
  //       return { success: false, error: error.message };
  //     }

  //     return { success: true };
  //   } catch (err) {
  //     console.error('Error in endRound:', err);
  //     return { success: false, error: 'Failed to end round' };
  //   }
  // }

  async kickParticipant(roundId: number, agentId: number): Promise<RoomOperationResult<void>> {
    try {
      const kickData: Database['public']['Tables']['round_agents']['Update'] = {
        kicked: true,
        outcome: {
          reason: 'kicked_by_gm',
          timestamp: new Date().toISOString(),
        },
      };

      const { error } = await supabase
        .from('round_agents')
        .update(kickData)
        .eq('round_id', roundId)
        .eq('agent_id', agentId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      console.error('Error in kickParticipant:', err);
      return { success: false, error: 'Failed to kick participant' };
    }
  }

  async getRound(
    roundId: number
  ): Promise<{ data: Tables<'rounds'> | null; error: PostgrestError | null }> {
    const { data, error } = await supabase.from('rounds').select('*').eq('id', roundId).single();
    return { data, error };
  }

  async getRoundAgents(
    roundId: number
  ): Promise<{ data: Tables<'round_agents'>[] | null; error: PostgrestError | null }> {
    const { data, error } = await supabase.from('round_agents').select('*').eq('round_id', roundId);
    return { data, error };
  }
}

export const roundService = new RoundService();
