package com.olivia.backend.service;

import com.olivia.backend.exceptions.BusinessLogicException;
import com.olivia.backend.model.MillingCenter;
import com.olivia.backend.repository.MillingCenterRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
public class MillingCenterService {

    @Autowired
    private MillingCenterRepository millingCenterRepository;

    public List<MillingCenter> getAllCenters() {
        return millingCenterRepository.findAll();
    }

    public Optional<MillingCenter> getCenterById(String id) {
        if (id == null) return Optional.empty();
        return millingCenterRepository.findById(id);
    }

    public MillingCenter saveCenter(MillingCenter center) {
        try {
            if (center.getId() == null || center.getId().isEmpty()) {
                center.setId(UUID.randomUUID().toString());
            }
            if (center.getStatus() == null) {
                center.setStatus("ACTIVE");
            }

            millingCenterRepository.save(center);
            log.info("Milling Center {} saved", center.getId());
            return center;
        } catch (Exception e) {
            throw new BusinessLogicException("Failed to save milling center: " + e.getMessage(), e);
        }
    }

    public void deleteCenter(String id) {
        try {
            millingCenterRepository.deleteById(id);
            log.info("Milling Center {} deleted", id);
        } catch (Exception e) {
            throw new BusinessLogicException("Failed to delete milling center: " + e.getMessage(), e);
        }
    }
}

