import React from "react";
import { Route, Redirect } from 'react-router-dom';

function RoleBasedRouting({
                              component: Component, roles, ...rest
                          }) {
    return (

        <Route {...rest} render={props => (
            grantPermission(roles)
                ? <Component {...props} />
                : <Redirect to={{ pathname: '/login', state: { from: props.location } }} />
        )} />

    );
}

const grantPermission = (requestedRoles) => {
    const permittedRoles =  JSON.parse(localStorage.getItem('user')).role;
    if(requestedRoles.includes (permittedRoles))
        return true;
    // in case of multiple roles, if one of the permittedRoles is present in requestedRoles, return true;
    return false;
};

export {RoleBasedRouting};