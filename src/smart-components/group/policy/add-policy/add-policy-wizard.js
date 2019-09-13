import React, { useEffect, useState } from 'react';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import { Wizard } from '@patternfly/react-core';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/';
import { fetchGroupPolicies } from '../../../../redux/actions/policy-actions';
import { fetchGroup } from '../../../../redux/actions/group-actions';
import { createPolicy } from '../../../../redux/actions/policy-actions';
import { fetchRoles } from '../../../../redux/actions/role-actions';
import SummaryContent from './summary-content';
import PolicyInformation from '../../add-group/policy-information';
import PolicySetRoles from '../../add-group/policy-set-roles';

const AddGroupPolicyWizard = ({
  history: { push },
  match: { params: { uuid }},
  addNotification,
  createPolicy,
  closeUrl
}) => {
  const [ roles, setRoles ] = useState([]);
  const [ selectedRoles, setSelectedRoles ] = useState([]);
  const [ formData, setValues ] = useState({});

  const handleChange = data => {
    setValues({ ...formData,  ...data });
  };

  const steps = [
    { name: 'Name and description', component: new PolicyInformation(formData, handleChange) },
    { name: 'Add roles', component: new PolicySetRoles(formData, selectedRoles, setSelectedRoles, roles) },
    { name: 'Review', component: new SummaryContent({ values: formData, selectedRoles }),
      nextButtonText: 'Confirm' }
  ];

  const fetchData = () => {
    console.log('Debug - AddGroupPolicyWizard fetchData');
    fetchRoles().payload.then((data) => setRoles(data));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const  onSubmit =  async() => {
    if (selectedRoles && selectedRoles.length > 0) {
      const policy_data = {
        name: formData.policyName,
        description: formData.policyDescription,
        group: uuid,
        roles: selectedRoles.map(role => role.value)
      };
      return createPolicy(policy_data).payload.then(() => fetchGroupPolicies({ group_uuid: uuid })).then(push(closeUrl));
    }
    else {
      return fetchGroupPolicies().then(push(closeUrl));
    }
  };

  const onCancel = () => {
    addNotification({
      variant: 'warning',
      title: 'Add policy',
      description: 'Adding policy was cancelled by the user.'
    });
    push(closeUrl);
  };

  return (
    <Wizard
      isLarge
      title={ 'Add policy' }
      isOpen
      onClose={ onCancel }
      onSave={ onSubmit }
      steps={ steps }
    />);

};

AddGroupPolicyWizard.defaultProps = {
  roles: [],
  inputValue: '',
  selectedRoles: []
};

AddGroupPolicyWizard.propTypes = {
  history: PropTypes.shape({
    goBack: PropTypes.func.isRequired
  }).isRequired,
  addNotification: PropTypes.func.isRequired,
  createPolicy: PropTypes.func.isRequired,
  inputValue: PropTypes.string,
  match: PropTypes.object,
  closeUrl: PropTypes.string
};

const mapStateToProps = ({ roleReducer: { roles, filterValue, isLoading }}) => ({
  roles: roles.data,
  pagination: roles.meta,
  isLoading,
  searchFilter: filterValue
});

const mapDispatchToProps = (dispatch) => bindActionCreators({
  addNotification,
  fetchGroup,
  createPolicy,
  fetchRoles
}, dispatch);

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(AddGroupPolicyWizard));
