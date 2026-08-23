import { useReducer, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export type Organization = {
  id: string;
  name: string;
  invite_code: string;
  role: string;
};

type State = {
  organizations: Organization[];
  loading: boolean;
  createOrgName: string;
  joinInviteCode: string;
  actionStatus: "idle" | "loading" | "success" | "error";
  actionMessage: string;
  newInviteCode: string;
};

const initialState: State = {
  organizations: [],
  loading: true,
  createOrgName: "",
  joinInviteCode: "",
  actionStatus: "idle",
  actionMessage: "",
  newInviteCode: "",
};

type Action =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: Organization[] }
  | { type: 'RESET' }
  | { type: 'SET_INPUT'; field: 'createOrgName' | 'joinInviteCode'; value: string }
  | { type: 'SET_ACTION_STATE'; status: State['actionStatus']; message: string; newCode?: string }
  | { type: 'DISMISS_ACTION_MESSAGE' }
  | { type: 'DISMISS_INVITE_CODE' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true };
    case 'FETCH_SUCCESS':
      return { ...state, organizations: action.payload, loading: false };
    case 'RESET':
      return initialState;
    case 'SET_INPUT':
      return { ...state, [action.field]: action.value };
    case 'SET_ACTION_STATE':
      return {
        ...state,
        actionStatus: action.status,
        actionMessage: action.message,
        ...(action.newCode !== undefined && { newInviteCode: action.newCode })
      };
    case 'DISMISS_ACTION_MESSAGE':
      return { ...state, actionMessage: "" };
    case 'DISMISS_INVITE_CODE':
      return { ...state, newInviteCode: "" };
    default:
      return state;
  }
}

export function useOrganizations(user: any) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const fetchOrganizations = useCallback(async () => {
    if (!user) {
      dispatch({ type: 'RESET' });
      // We must explicitly set loading to false after reset because initialState.loading is true
      // Or we can modify the reducer to accept a payload for RESET, but doing it this way:
      dispatch({ type: 'FETCH_SUCCESS', payload: [] });
      return [];
    }

    dispatch({ type: 'FETCH_START' });
    const supabase = createClient();
    const { data, error } = await supabase
      .from('organization_members')
      .select('organization_id, role, organizations(id, name, invite_code)');

    if (!error && data) {
      const formatted = data.map((item: any) => ({
        id: item.organizations.id,
        name: item.organizations.name,
        invite_code: item.organizations.invite_code,
        role: item.role
      }));

      // Deduplicate as a defensive safety net in case database unique constraint isn't acting perfectly yet
      const seen = new Set();
      const deduplicated = formatted.filter(org => {
        if (seen.has(org.id)) return false;
        seen.add(org.id);
        return true;
      });

      dispatch({ type: 'FETCH_SUCCESS', payload: deduplicated });
      return deduplicated;
    }

    dispatch({ type: 'FETCH_SUCCESS', payload: [] });
    return [];
  }, [user]);

  const handleCreateOrg = async () => {
    if (!user) throw new Error("Must be logged in to create an organization");
    if (!state.createOrgName.trim()) return;

    dispatch({ type: 'SET_ACTION_STATE', status: 'loading', message: '', newCode: '' });

    try {
      const supabase = createClient();
      const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      const values = new Uint32Array(12);
      window.crypto.getRandomValues(values);
      let code = '';
      for (let i = 0; i < 12; i++) {
        code += charset[values[i] % charset.length];
      }

      const { error } = await supabase.rpc('create_organization_with_admin', {
        org_name: state.createOrgName,
        invite_code: code
      });

      if (error) throw error;

      dispatch({ type: 'SET_ACTION_STATE', status: 'success', message: 'Organization created successfully!', newCode: code });
      dispatch({ type: 'SET_INPUT', field: 'createOrgName', value: '' });
      await fetchOrganizations();
    } catch (err: any) {
      dispatch({ type: 'SET_ACTION_STATE', status: 'error', message: err.message || 'Failed to create organization.' });
    }
  };

  const handleJoinOrg = async () => {
    if (!user) throw new Error("Must be logged in to join an organization");
    if (!state.joinInviteCode.trim()) return;

    dispatch({ type: 'SET_ACTION_STATE', status: 'loading', message: '', newCode: '' });

    try {
      const supabase = createClient();

      const { data: orgData, error: lookupError } = await supabase.rpc('lookup_organization_by_invite_code', {
        lookup_code: state.joinInviteCode
      });

      if (lookupError) throw lookupError;
      if (!orgData || orgData.length === 0) {
        throw new Error("Invalid invite code or organization not found.");
      }

      const orgId = orgData[0].id;

      // Pre-flight check: acts as a fast-fail UX convenience
      if (state.organizations.some(o => o.id === orgId)) {
        throw new Error("You are already a member of this organization.");
      }

      const { error: joinError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: orgId,
          user_id: user.id,
          role: 'member'
        });

      if (joinError) {
        // This is the ultimate source of truth caught from the DB constraint
        if (joinError.code === '23505') throw new Error("You are already a member of this organization.");
        throw joinError;
      }

      dispatch({ type: 'SET_ACTION_STATE', status: 'success', message: `Successfully joined ${orgData[0].name}!` });
      dispatch({ type: 'SET_INPUT', field: 'joinInviteCode', value: '' });
      await fetchOrganizations();
    } catch (err: any) {
      dispatch({ type: 'SET_ACTION_STATE', status: 'error', message: err.message || 'Failed to join organization.' });
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  return {
    ...state,
    dispatch,
    fetchOrganizations,
    handleCreateOrg,
    handleJoinOrg
  };
}
