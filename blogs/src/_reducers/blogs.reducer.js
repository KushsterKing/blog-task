import { blogConstants } from '../_constants';

export function blogs(state = {}, action) {
    switch (action.type) {
        case blogConstants.GETALL_REQUEST:
            return {
                loading: true
            };
        case blogConstants.GETALL_SUCCESS:
            return {
                items: action.blogs
            };
        case blogConstants.GETALL_FAILURE:
            return {
                error: action.error
            };
        case blogConstants.DELETE_REQUEST:
            // add 'deleting:true' property to user being deleted
            return {
                ...state,
                items: state.items.map(user =>
                    user._id === action.id
                        ? { ...user, deleting: true }
                        : user
                )
            };
        case blogConstants.DELETE_SUCCESS:
            // remove deleted user from state
            return {
                items: state.items.filter(user => user._id !== action.id)
            };
        case blogConstants.DELETE_FAILURE:
            // remove 'deleting:true' property and add 'deleteError:[error]' property to user
            return {
                ...state,
                items: state.items.map(user => {
                    if (user._id === action.id) {
                        // make copy of user without 'deleting:true' property
                        const { deleting, ...userCopy } = user;
                        // return copy of user with 'deleteError:[error]' property
                        return { ...userCopy, deleteError: action.error };
                    }

                    return user;
                })
            };
        case blogConstants.ADD_REQUEST:
            // add 'deleting:true' property to user being deleted
            if(!state.items)
                state.items = [];
            console.log(state.items);
            return {
                ...state,
                adding: true
            };
        case blogConstants.ADD_SUCCESS:
            // remove deleted user from state
            state.items.push(action.blog);
            return {
                items: state.items
            };
        case blogConstants.ADD_FAILURE:
            // remove 'deleting:true' property and add 'deleteError:[error]' property to user
            return {
                ...state,
                adding: false,
                addError: action.error
            };
        case blogConstants.UPDATE_REQUEST:
            // add 'deleting:true' property to user being deleted
            return {
                ...state,
                items: state.items.map(user =>
                    user._id === action.id
                        ? { ...user, updating: true }
                        : user
                )
            };
        case blogConstants.UPDATE_SUCCESS:
            // remove deleted user from state
            return {
                items: state.items.map( item => {if(item._id === action.blog.id) return action.blog; else return item})
            };
        case blogConstants.UPDATE_FAILURE:
            // remove 'deleting:true' property and add 'deleteError:[error]' property to user
            return {
                ...state,
                items: state.items.map(user => {
                    if (user._id === action.id) {
                        // make copy of user without 'deleting:true' property
                        const { updating, ...userCopy } = user;
                        // return copy of user with 'deleteError:[error]' property
                        return { ...userCopy, updateError: action.error };
                    }

                    return user;
                })
            };
        case blogConstants.APPRoVE_REQUEST:
            // add 'deleting:true' property to user being deleted
            return {
                ...state,
                items: state.items.map(user =>
                    user._id === action.id
                        ? { ...user, approving: true }
                        : user
                )
            };
        case blogConstants.APPROVE_SUCCESS:
            // remove deleted user from state
            return {
                items: state.items.map( item => {if(item._id === action.id) return { ...item, approving: false, approved: true}; else return item})
            };
        case blogConstants.APPROVE_FAILURE:
            // remove 'deleting:true' property and add 'deleteError:[error]' property to user
            return {
                ...state,
                items: state.items.map(user => {
                    if (user._id === action.id) {
                        // make copy of user without 'deleting:true' property
                        const { approving, ...userCopy } = user;
                        // return copy of user with 'deleteError:[error]' property
                        return { ...userCopy, approveError: action.error };
                    }

                    return user;
                })
            };
        default:
            return state
    }
}